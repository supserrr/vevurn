import express from 'express'
import productRoutes from '../src/routes/products'

const app = express()

// Test that the routes import correctly
app.use('/api/products', productRoutes)

console.log('Products routes imported successfully!')
