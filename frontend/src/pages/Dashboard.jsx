import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Mock data — replace with real analytics when available
const dummyData = [
    {
        id: "john-doe",
        name: "John Doe",
        manipulativeCount: 12,
        topTechniques: ["Rationalization", "Accusation"],
    },
    {
        id: "jane-smith",
        name: "Jane Smith",
        manipulativeCount: 9,
        topTechniques: ["Shaming or Belittlement", "Playing Victim Role"],
    },
    {
        id: "ai-assistant",
        name: "WhiteMirror AI",
        manipulativeCount: 2,
        topTechniques: ["Feigning Innocence"],
    },
];

function Dashboard() {
    return (
        <section className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="col-span-1 md:col-span-2">
                <CardContent className="p-4">
                    <h2 className="text-2xl font-semibold mb-4">
                        Most Manipulative Users
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dummyData} layout="vertical">
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar
                                dataKey="manipulativeCount"
                                fill="#ef4444"
                                radius={[0, 8, 8, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {dummyData.map((user) => (
                <Card key={user.id}>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-1">
                            {user.name}
                        </h3>
                        <p className="text-sm mb-1">
                            <strong>Manipulative Messages:</strong>{" "}
                            {user.manipulativeCount}
                        </p>
                        <p className="text-sm">
                            <strong>Top Techniques:</strong>{" "}
                            {user.topTechniques?.length > 0
                                ? user.topTechniques.join(", ")
                                : "None"}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </section>
    );
}

export default Dashboard;
