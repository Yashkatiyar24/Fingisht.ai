// Mock backend for development
const generateMockData = () => {
  const categories = [
    { id: 1, name: 'Food & Dining', color: '#FF6B6B' },
    { id: 2, name: 'Shopping', color: '#4ECDC4' },
    { id: 3, name: 'Transportation', color: '#45B7D1' },
    { id: 4, name: 'Bills & Utilities', color: '#96CEB4' },
    { id: 5, name: 'Entertainment', color: '#FFEEAD' },
  ];

  const dailySpend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString(),
      total: Math.floor(Math.random() * 1000) + 100,
    };
  });

  const categoryBreakdown = categories.map(cat => ({
    categoryId: cat.id,
    categoryName: cat.name,
    categoryColor: cat.color,
    total: Math.floor(Math.random() * 5000) + 1000,
  }));

  const topMerchants = [
    { merchant: 'Amazon', total: 1250, count: 12 },
    { merchant: 'Starbucks', total: 850, count: 15 },
    { merchant: 'Uber', total: 620, count: 8 },
    { merchant: 'Netflix', total: 150, count: 1 },
    { merchant: 'Whole Foods', total: 480, count: 5 },
  ];

  const totalSpend = dailySpend.reduce((sum, day) => sum + day.total, 0);
  const incomeTotal = 10000; // Mock income
  const expenseTotal = totalSpend;

  return {
    totalSpend,
    incomeTotal,
    expenseTotal,
    transactionCount: 41,
    avgPerDay: Math.round(totalSpend / 30),
    categoryBreakdown,
    dailySpend,
    monthlySpend: [
      { month: new Date().toISOString().split('T')[0], total: totalSpend },
    ],
    topMerchants,
  };
};

export const mockBackend = {
  dashboard: {
    getStats: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockData();
    },
  },
  ai: {
    getInsights: async () => ({
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
    }),
    getAnomalies: async () => [
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
    ]
  }
};

export default mockBackend;
