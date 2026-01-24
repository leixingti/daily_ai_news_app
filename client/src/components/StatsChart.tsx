import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface StatsChartProps {
  data: Array<{ category?: string; region?: string; count: number }>;
  type?: "bar" | "pie";
  title?: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const categoryLabels: Record<string, string> = {
  tech: "技术创新",
  product: "产品发布",
  industry: "行业动态",
  manufacturer: "AI原厂新闻",
  domestic: "国内",
  international: "国际",
};

export default function StatsChart({ data, type = "bar", title }: StatsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        暂无数据
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: categoryLabels[(item.category || item.region) as string] || (item.category || item.region),
    value: item.count,
  }));

  if (type === "pie") {
    return (
      <Card className="p-6">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
