/// <reference path="./types/express/index.d.ts" />
import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketIO } from './socket';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });
setupSocketIO(io);

// Auth routes
import authRouter from './routes/api/auth';
import protectedRouter from './routes/api/protected';
import employeeRouter from './routes/api/employee';
import vendorRouter from './routes/api/vendor';
import vendorOrdersRouter from './routes/api/vendor/orders';
import employeeInventoryRouter from './routes/api/employee/inventory';
import billingRouter from './routes/api/billing/index';
import employeeOrdersRouter from './routes/api/employee/orders';
import messagesRouter from './routes/api/messages';
import warehouseRouter from './routes/api/warehouse';
import routeCoordinatesRouter from './routes/api/route-coordinates';
import shortestRouteRouter from './routes/api/shortest-route';
import orsDistanceRouter from './routes/api/ors-distance';

app.use('/api/auth', authRouter);
app.use('/api/protected', protectedRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/vendor/orders', vendorOrdersRouter);
app.use('/api/employee/inventory', employeeInventoryRouter);
app.use('/api/billing', billingRouter);
app.use('/api/employee/orders', employeeOrdersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/warehouse', warehouseRouter(io));
app.use('/api/route-coordinates', routeCoordinatesRouter);
app.use('/api/shortest-route', shortestRouteRouter);
app.use('/api/ors-distance', orsDistanceRouter);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 