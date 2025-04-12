from __future__ import annotations

from dotenv import load_dotenv
load_dotenv() 

from enum import StrEnum
from os import environ

class Env(StrEnum):
    @staticmethod
    def raw_get(key: str, raise_if_none: bool = False):
        value = environ.get(key, None)
        if (value is None) and raise_if_none:
            raise KeyError(f"Environment variable `{key}` does not exist.")

        return value

if __name__ == "__main__":
    print(Env.raw_get("POSTGRES_USER"))