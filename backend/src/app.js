import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupDocs } from './docs/openapi.js';

import { authRouter, userAdminRouter }               from './modules/auth/auth.routes.js';
import { productPublicRouter, productAdminRouter }    from './modules/products/product.routes.js';
import { collectionPublicRouter, collectionAdminRouter } from './modules/collections/collection.routes.js';
import { cartRouter }                                 from './modules/cart/cart.routes.js';
import { orderCustomerRouter, orderAdminRouter }      from './modules/orders/order.routes.js';
import { wishlistRouter }                             from './modules/wishlist/wishlist.routes.js';
import { messageCustomerRouter, messageAdminRouter }  from './modules/messages/message.routes.js';
import { couponCustomerRouter, couponAdminRouter }    from './modules/coupons/coupon.routes.js';
import { reviewPublicRouter, reviewCustomerRouter, reviewAdminRouter } from './modules/reviews/review.routes.js';
import { newsPublicRouter, newsAdminRouter }          from './modules/news/news.routes.js';
import { settingsPublicRouter, settingsAdminRouter }  from './modules/settings/settings.routes.js';
import { uploadAdminRouter }                          from './modules/uploads/upload.routes.js';
import { UPLOAD_ROOT }                                from './modules/uploads/upload.service.js';
import { flashSalePublicRouter, flashSaleAdminRouter } from './modules/flash-sales/flash_sale.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );

  // Ảnh admin tải lên. crossOriginResourcePolicy của helmet mặc định chặn ảnh
  // nhúng từ origin khác, mà frontend chạy ở cổng 3000 — nên phải nới ở đây.
  app.use('/uploads', express.static(UPLOAD_ROOT, {
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }));

  const v1 = '/api/v1';

  // ── Public (được phép không đăng nhập) ─────────────────────────────────────
  app.use(`${v1}/auth`,        authRouter);
  app.use(`${v1}/products`,    productPublicRouter);
  app.use(`${v1}/collections`, collectionPublicRouter);
  app.use(`${v1}/reviews`,     reviewPublicRouter);
  app.use(`${v1}/news`,        newsPublicRouter);
  app.use(`${v1}/settings`,    settingsPublicRouter);
  app.use(`${v1}/flash-sales`, flashSalePublicRouter);

  // ── Customer (khách hàng đã đăng nhập) ────────────────────
  app.use(`${v1}/customer/cart`,     cartRouter);
  app.use(`${v1}/customer/orders`,   orderCustomerRouter);
  app.use(`${v1}/customer/wishlist`, wishlistRouter);
  app.use(`${v1}/customer/coupons`,  couponCustomerRouter);
  app.use(`${v1}/customer/reviews`,  reviewCustomerRouter);
  app.use(`${v1}/customer/messages`, messageCustomerRouter);

  // ── Admin (quản trị) ────────────────────────────────────────────────
  app.use(`${v1}/admin/products`,     productAdminRouter);
  app.use(`${v1}/admin/collections`,  collectionAdminRouter);
  app.use(`${v1}/admin/orders`,       orderAdminRouter);
  app.use(`${v1}/admin/users`,        userAdminRouter);
  app.use(`${v1}/admin/coupons`,      couponAdminRouter);
  app.use(`${v1}/admin/reviews`,      reviewAdminRouter);
  app.use(`${v1}/admin/messages`,     messageAdminRouter);
  app.use(`${v1}/admin/news`,         newsAdminRouter);
  app.use(`${v1}/admin/settings`,     settingsAdminRouter);
  app.use(`${v1}/admin/uploads`,      uploadAdminRouter);
  app.use(`${v1}/admin/flash-sales`,  flashSaleAdminRouter);

  if (config.openapiEnabled) setupDocs(app);

  app.use((_req, res) => res.status(404).json({ success: false, message: 'Không tìm thấy endpoint' }));
  app.use(errorHandler);

  return app;
}
