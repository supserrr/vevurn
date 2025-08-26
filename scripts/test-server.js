const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mock data
const mockProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Case',
    category: { id: '1', name: 'Phone Cases' },
    brand: 'Apple',
    price: 45000,
    stockQuantity: 25,
    description: 'Premium silicone case for iPhone 15 Pro',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Samsung Galaxy S24 Screen Protector',
    category: { id: '2', name: 'Screen Protectors' },
    brand: 'Samsung',
    price: 12000,
    stockQuantity: 50,
    description: 'Tempered glass screen protector',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

const mockCustomers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+250789123456',
    address: 'Nyarugenge, Kigali',
    type: 'REGULAR',
    totalPurchases: 5,
    lastPurchaseDate: '2024-08-20',
    createdAt: '2024-07-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@business.com',
    phone: '+250788654321',
    address: 'Gasabo, Kigali',
    type: 'WHOLESALE',
    totalPurchases: 12,
    lastPurchaseDate: '2024-08-22',
    createdAt: '2024-06-10T14:30:00Z'
  }
];

const mockSales = [
  {
    id: '1',
    customerName: 'John Doe',
    items: [
      { id: '1', name: 'iPhone 15 Pro Case', quantity: 1, price: 45000 }
    ],
    subtotal: 45000,
    tax: 6750,
    total: 51750,
    paymentMethod: 'CASH',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  }
];

// Auth endpoints
app.get('/api/auth/session', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN'
      }
    }
  });
});

// Product endpoints
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: mockProducts
  });
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: String(mockProducts.length + 1),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockProducts.push(newProduct);
  res.json({
    success: true,
    data: newProduct
  });
});

app.put('/api/products/:id', (req, res) => {
  const index = mockProducts.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockProducts[index] = { ...mockProducts[index], ...req.body };
    res.json({
      success: true,
      data: mockProducts[index]
    });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const index = mockProducts.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockProducts.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Customer endpoints
app.get('/api/customers', (req, res) => {
  res.json({
    success: true,
    data: mockCustomers
  });
});

app.post('/api/customers', (req, res) => {
  const newCustomer = {
    id: String(mockCustomers.length + 1),
    ...req.body,
    totalPurchases: 0,
    createdAt: new Date().toISOString()
  };
  mockCustomers.push(newCustomer);
  res.json({
    success: true,
    data: newCustomer
  });
});

app.put('/api/customers/:id', (req, res) => {
  const index = mockCustomers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    mockCustomers[index] = { ...mockCustomers[index], ...req.body };
    res.json({
      success: true,
      data: mockCustomers[index]
    });
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  const index = mockCustomers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    mockCustomers.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// Sales endpoints
app.get('/api/sales', (req, res) => {
  res.json({
    success: true,
    data: mockSales
  });
});

app.post('/api/sales', (req, res) => {
  const newSale = {
    id: String(mockSales.length + 1),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockSales.push(newSale);
  res.json({
    success: true,
    data: newSale
  });
});

// Dashboard endpoints
app.get('/api/dashboard/summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalSales: 145000,
      totalOrders: 8,
      totalCustomers: mockCustomers.length,
      totalProducts: mockProducts.length,
      recentSales: mockSales.slice(0, 5),
      lowStockProducts: mockProducts.filter(p => p.stockQuantity < 10)
    }
  });
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Phone Cases', description: 'Protective cases for smartphones' },
      { id: '2', name: 'Screen Protectors', description: 'Screen protection films and glasses' },
      { id: '3', name: 'Chargers', description: 'Charging cables and adapters' },
      { id: '4', name: 'Headphones', description: 'Audio accessories' },
      { id: '5', name: 'Power Banks', description: 'Portable charging devices' }
    ]
  });
});

// Catch-all for unhandled routes
app.use('*', (req, res) => {
  console.log(`Unhandled ${req.method} request to ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`🚀 Test server running on http://localhost:${port}`);
  console.log('📋 Available endpoints:');
  console.log('  - GET  /api/auth/session');
  console.log('  - GET  /api/products');
  console.log('  - POST /api/products');
  console.log('  - GET  /api/customers');
  console.log('  - POST /api/customers');
  console.log('  - GET  /api/sales');
  console.log('  - POST /api/sales');
  console.log('  - GET  /api/dashboard/summary');
  console.log('  - GET  /api/categories');
});
