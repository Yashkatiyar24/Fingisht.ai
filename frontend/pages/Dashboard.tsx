import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Receipt, Target, Sparkles, AlertTriangle } from "lucide-react";
import { useBackend } from "@/lib/backend";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { formatCurrency } from "@/lib/format";

export function Dashboard() {
  const backend = useBackend();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return await backend.dashboard.getStats({});
    },
  });

  const { data: insights } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      return await backend.ai.getInsights({});
    },
  });

  const { data: anomalies } = useQuery({
    queryKey: ["anomalies"],
    queryFn: async () => {
      return await backend.ai.getAnomalies({});
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const categoryData = stats.categoryBreakdown.map(cat => ({
    name: cat.categoryName,
    value: cat.total,
    color: cat.categoryColor,
  }));

  const dailyData = stats.dailySpend.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: day.total,
  }));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spend
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(stats.totalSpend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg per Day
            </CardTitle>
            <Receipt className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(stats.avgPerDay)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Category
            </CardTitle>
            <Target className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.topCategory?.categoryName || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.topCategory ? formatCurrency(stats.topCategory.total) : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.categoryBreakdown.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
          <CardHeader>
            <CardTitle>Daily Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
                <Bar dataKey="amount" fill="#6EE7F9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights && insights.bullets.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl border-cyan-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <CardTitle>Smart Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {insights.bullets.map((bullet, idx) => (
                <div 
                  key={idx}
                  className={`
                    flex items-start gap-3 p-3 rounded-xl transition-all
                    ${bullet.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' : 
                      bullet.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 
                      'bg-cyan-500/10 border border-cyan-500/20'}
                  `}
                >
                  {bullet.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />}
                  {bullet.type === 'success' && <TrendingDown className="w-4 h-4 text-green-400 mt-0.5" />}
                  {bullet.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5" />}
                  <p className="text-sm flex-1">{bullet.text}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground pt-2 border-t border-border/40">
              {insights.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {anomalies && anomalies.anomalies.filter(a => !a.acknowledged).length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl border-yellow-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <CardTitle>Unusual Spending Detected</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.anomalies.filter(a => !a.acknowledged).slice(0, 3).map((anomaly) => (
                <div 
                  key={anomaly.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div>
                    <p className="font-medium">{new Date(anomaly.date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.severity.toUpperCase()} severity anomaly (z-score: {anomaly.zScore.toFixed(2)})
                    </p>
                  </div>
                  <span className="font-bold text-yellow-400">{formatCurrency(anomaly.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Merchants */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topMerchants.slice(0, 5).map((merchant, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{merchant.merchant}</p>
                    <p className="text-xs text-muted-foreground">{merchant.count} transactions</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(merchant.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
