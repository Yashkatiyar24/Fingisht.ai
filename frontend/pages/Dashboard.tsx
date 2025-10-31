import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Sparkles, 
  AlertTriangle, 
  PiggyBank,
} from "lucide-react";
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
  Legend,
  AreaChart,
  Area
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

// Mock data generator
const generateMockData = () => {
  const categories = [
    { categoryName: 'Food & Dining', total: 1200, categoryColor: '#FF6B6B' },
    { categoryName: 'Shopping', total: 850, categoryColor: '#4ECDC4' },
    { categoryName: 'Transportation', total: 450, categoryColor: '#45B7D1' },
    { categoryName: 'Bills & Utilities', total: 650, categoryColor: '#96CEB4' },
    { categoryName: 'Entertainment', total: 300, categoryColor: '#FFEEAD' },
  ];

  const dailySpend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString(),
      total: Math.floor(Math.random() * 200) + 50,
    };
  });

  const monthlySpend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toISOString(),
      total: Math.floor(Math.random() * 2000) + 1000,
    };
  });

  const topMerchants = [
    { merchant: 'Amazon', total: 450, count: 8 },
    { merchant: 'Starbucks', total: 150, count: 12 },
    { merchant: 'Uber', total: 200, count: 5 },
    { merchant: 'Netflix', total: 15, count: 1 },
    { merchant: 'Whole Foods', total: 180, count: 4 },
  ];

  const incomeTotal = 5000;
  const expenseTotal = dailySpend.reduce((sum, day) => sum + day.total, 0);

  return {
    categoryBreakdown: categories,
    dailySpend,
    monthlySpend,
    topMerchants,
    incomeTotal,
    expenseTotal,
    transactionCount: 41,
    avgPerDay: Math.round(expenseTotal / 30),
  };
};

// Mock insights and anomalies
const mockInsights = {
  bullets: [
    {
      type: 'info',
      text: 'Your spending on dining has increased by 15% compared to last month.'
    },
    {
      type: 'warning',
      text: 'You\'re spending more than usual on shopping. Consider setting a budget.'
    },
    {
      type: 'success',
      text: 'Great job! Your savings rate is 25% higher than last month.'
    }
  ]
};

const mockAnomalies = [
  {
    id: 1,
    description: 'Unusually high transaction at Amazon',
    amount: 249.99,
    date: new Date().toISOString(),
    category: 'Shopping',
    isRecurring: false
  },
  {
    id: 2,
    description: 'Duplicate transaction detected',
    amount: 15.99,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Food & Dining',
    isRecurring: true
  }
];

export function Dashboard() {
  const [timeRange, setTimeRange] = React.useState('30d');
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState<any>(null);
  const [insights, setInsights] = React.useState<any>(null);
  const [anomalies, setAnomalies] = React.useState<any>(null);

  React.useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock data
        setStats(generateMockData());
        setInsights(mockInsights);
        setAnomalies(mockAnomalies);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading your financial data...</p>
        </div>
      </div>
    );
  }
  
  // Process data for charts
  const categoryData = (stats.categoryBreakdown || []).map((cat: { categoryName: string; total: number; categoryColor?: string }) => ({
    name: cat.categoryName,
    value: Math.abs(cat.total),
    color: cat.categoryColor || '#8884d8',
  }));

  const dailyData = (stats.dailySpend || []).map((day: { date: string; total: number }) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: Math.abs(day.total),
  }));

  const monthlyData = (stats.monthlySpend || []).map((month: { month: string; total: number }) => ({
    month: new Date(month.month).toLocaleDateString('en-US', { month: 'short' }),
    amount: Math.abs(month.total),
  }));

  const topMerchants = (stats.topMerchants || []).slice(0, 5).map((m: { merchant: string; total: number; count: number }) => ({
    name: m.merchant,
    value: Math.abs(m.total),
    count: m.count,
  }));

  // Calculate savings rate if income data is available
  const income = stats.incomeTotal || 0;
  const expenses = Math.abs(stats.expenseTotal || 0);
  const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0;
  
  // Get date range for display
  const { start: startDate, end: endDate } = (() => {
    const now = new Date();
    const start = new Date();
    
    switch(timeRange) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setMonth(now.getMonth() - 1);
        break;
      case '90d':
        start.setMonth(now.getMonth() - 3);
        break;
      case '12m':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    
    return {
      start: start,
      end: now
    };
  })();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Viewing demo data. Sign in to connect your own financial accounts.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={timeRange === '7d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7D
          </Button>
          <Button 
            variant={timeRange === '30d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30D
          </Button>
          <Button 
            variant={timeRange === '90d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90D
          </Button>
          <Button 
            variant={timeRange === '12m' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('12m')}
          >
            12M
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/20 border-cyan-100 dark:border-cyan-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(income)}</div>
            <p className="text-xs text-muted-foreground">
              {income > 0 ? `+${Math.round((income / (income + expenses)) * 100)}% of total` : 'No income'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/20 border-rose-100 dark:border-rose-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses > 0 ? `${Math.round((expenses / (income || 1)) * 100)}% of income` : 'No expenses'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-amber-100 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsRate}%</div>
            <p className="text-xs text-muted-foreground">
              {Number(savingsRate) > 20 ? 'Excellent!' : Number(savingsRate) > 10 ? 'Good' : 'Could be better'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 border-emerald-100 dark:border-emerald-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgPerDay ? `${Math.round(stats.avgPerDay)} per day` : 'No transactions'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Spending by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry: { color: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Spending Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      {insights?.bullets?.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl border-cyan-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
            <CardDescription>Smart analysis of your spending patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.bullets.map((insight: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1">
                    {insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <span>{insight.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {anomalies?.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl border-rose-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <CardTitle>Unusual Spending Detected</CardTitle>
            </div>
            <CardDescription>Potential anomalies in your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {anomalies.map((anomaly: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <p>{anomaly.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(anomaly.amount)} • {anomaly.date}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
