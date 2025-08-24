const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  products: {
    getAll: (params?: { search?: string; page?: number; limit?: number }) => {
      const url = new URL(`${API_BASE}/api/products`);
      if (params?.search) url.searchParams.append('query', params.search);
      if (params?.page) url.searchParams.append('page', params.page.toString());
      if (params?.limit) url.searchParams.append('limit', params.limit.toString());
      
      return fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json());
    },
    
    getById: (id: string) => 
      fetch(`${API_BASE}/api/products/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json()),
    
    search: (query: string) => 
      fetch(`${API_BASE}/api/products?query=${encodeURIComponent(query)}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json())
  },
  
  sales: {
    create: (sale: any) => 
      fetch(`${API_BASE}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sale)
      }).then(r => r.json()),
    
    getAll: () => 
      fetch(`${API_BASE}/api/sales`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json()),
    
    getById: (id: string) => 
      fetch(`${API_BASE}/api/sales/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json())
  },
  
  payments: {
    momo: (payment: any) => 
      fetch(`${API_BASE}/api/payments/momo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payment)
      }).then(r => r.json()),
    
    cash: (payment: any) => 
      fetch(`${API_BASE}/api/payments/cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payment)
      }).then(r => r.json()),
    
    checkStatus: (id: string) => 
      fetch(`${API_BASE}/api/payments/${id}/status`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json())
  },
  
  customers: {
    getAll: () => 
      fetch(`${API_BASE}/api/customers`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json()),
    
    create: (customer: any) => 
      fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(customer)
      }).then(r => r.json()),
    
    getById: (id: string) => 
      fetch(`${API_BASE}/api/customers/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json())
  }
};
