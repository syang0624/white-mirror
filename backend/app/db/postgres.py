from collections.abc import Mapping, Sequence
from contextlib import asynccontextmanager
from datetime import date, datetime
from typing import Any, TypeVar, Unpack
from uuid import UUID

from sqlalchemy import Result, Select, insert
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID as pUUID
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.schema import CreateTable
from sqlalchemy.sql import text
from typing_extensions import TypedDict


class ConnParams(TypedDict):
    db_user: str
    db_pass: str
    db_host: str
    db_name: str
    db_port: int


T = TypeVar("T", bound=tuple[Any, ...])


def result_as_tuple(result: Result[T]) -> Sequence[T]:
    raw_rows = result.all()

    rows: list[T] = []
    for rr in raw_rows:
        rows.append(rr._tuple())  # pyright: ignore[reportPrivateUsage]

    return rows


def raw_create_table_sql(base: type[DeclarativeBase]):
    dialect = postgresql.dialect()
    compiler = dialect.ddl_compiler(
        dialect, None # pyright: ignore[reportArgumentType]
    )

    entire_stmt = ""

    for table in base.metadata.sorted_tables:
        stmt = CreateTable(table)
        raw_sql = compiler.process(stmt)

        entire_stmt += raw_sql.strip() + ";\n"

    return entire_stmt


class Postgres:
    """Asynchronous interface to PostgreSQL database via SQLAlchemy.
    Typically, database is initiated via the `init` method:
    ```
    async with Postgres.init(...) as db:
        print("Successfully connected to the PostgreSQL database")
    ```
    """

    @staticmethod
    def create_engine(
        *,
        pool_size: int = 100,
        echo: bool = False,
        **kwargs: Unpack[ConnParams],
    ):
        """Creating connection string:
        https://stackoverflow.com/a/75885662
        """
        db_user = kwargs["db_user"]
        db_pass = kwargs["db_pass"]
        db_host = kwargs["db_host"]
        db_name = kwargs["db_name"]
        db_port = kwargs["db_port"]

        url = f"postgresql+psycopg://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        engine = create_async_engine(url, echo=echo, pool_size=pool_size)

        return engine

    @asynccontextmanager
    @staticmethod
    async def init(
        *,
        pool_size: int = 100,
        echo: bool = False,
        expire_on_commit: bool = True,
        **kwargs: Unpack[ConnParams],
    ):
        engine = Postgres.create_engine(pool_size=pool_size, echo=echo, **kwargs)

        try:
            async with engine.connect() as conn:
                yield Postgres(
                    engine=engine, conn=conn, expire_on_commit=expire_on_commit
                )
        finally:
            "close and clean-up pooled connections"
            await engine.dispose()

    def __init__(
        self, engine: AsyncEngine, conn: AsyncConnection, expire_on_commit: bool = True
    ) -> None:
        super().__init__()

        self.engine: AsyncEngine = engine
        self.conn: AsyncConnection = conn
        self.session: async_sessionmaker[AsyncSession] = async_sessionmaker(
            engine, expire_on_commit=expire_on_commit
        )

    async def execute_raw_stmt(self, stmt: str, **params: Any):
        """Cf. https://github.com/sqlalchemy/sqlalchemy/discussions/10136"""
        raw_stmt = text(stmt)
        if params:
            raw_stmt = raw_stmt.bindparams(**params)

        async with self.session() as sess:
            async with sess.begin():
                _ = await sess.execute(raw_stmt)
            # inner context calls session.commit(), if there were no exceptions
        # outer context calls session.close()

    async def create_table(self, base: type[DeclarativeBase], table_name: str | None):
        """https://stackoverflow.com/a/66970356"""
        async with self.conn.begin():
            """Setting `checkfirst=True` will raise exception
            if `table_name` already exists.
            """
            if isinstance(table_name, str):
                await self.conn.run_sync(
                    base.metadata.tables[table_name].create, checkfirst=False
                )
            else:
                await self.conn.run_sync(base.metadata.create_all, checkfirst=True)

    async def drop_table(self, base: type[DeclarativeBase], table_name: str | None):
        async with self.conn.begin():
            """Setting `checkfirst=True` will raise exception
            if `table_name` does not exist.
            """
            if isinstance(table_name, str):
                await self.conn.run_sync(
                    base.metadata.tables[table_name].drop, checkfirst=False
                )
            else:
                await self.conn.run_sync(base.metadata.drop_all, checkfirst=True)

    async def insert(self, objects: Sequence[DeclarativeBase]):
        async with self.session() as sess:
            async with sess.begin():
                sess.add_all(objects)

    async def bulk_insert(
        self, base: type[DeclarativeBase], objects: Sequence[dict[str, Any]]
    ):
        """`session.add_all` is sub-optimal for large batches.
        In the official document, it is recommended
        to use `insert` statement instead.

        - https://stackoverflow.com/q/3659142
        - https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html
        """
        async with self.session() as sess:
            async with sess.begin():
                stmt = insert(base).values(objects)
                _ = await sess.execute(stmt)

    async def select(self, stmt: Select[T]) -> Result[T]:
        async with self.session() as sess:
            result = await sess.execute(stmt)

        return result

    @asynccontextmanager
    async def session_autocommit(self):
        """https://docs.sqlalchemy.org/en/20/orm/session_basics.html"""
        async with self.session() as sess:
            async with sess.begin():
                """Automatic `commit` and `rollback`"""
                yield sess
