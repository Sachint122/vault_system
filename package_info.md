# 😈 devil-backend-nodejs

> A production-ready Node.js + Express + MongoDB backend boilerplate CLI with built-in utilities.

[![npm version](https://img.shields.io/npm/v/devil-backend-nodejs)](https://www.npmjs.com/package/devil-backend-nodejs)
[![npm downloads](https://img.shields.io/npm/dm/devil-backend-nodejs)](https://www.npmjs.com/package/devil-backend-nodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Sachint122/devil-backend-nodejs/blob/main/LICENSE)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [CLI Flags](#-cli-flags)
- [Generated Project Structure](#-generated-project-structure)
- [Install as Package](#-install-as-package)
- [Backend Utilities](#-backend-utilities)
  - [asyncHandler](#asynchandler)
  - [paginate](#paginate)
  - [ApiError](#apierror)
  - [ApiResponse](#apiresponse)
  - [generateToken](#generatetoken)
  - [generateOTP](#generateotp)
  - [randomString](#randomstring)
  - [slugify](#slugify)
  - [capitalize & capitalizeWords](#capitalize--capitalizewords)
  - [formatDate & timeAgo](#formatdate--timeago)
  - [pick & exclude](#pick--exclude)
  - [isEmptyObject](#isemptyobject)
  - [calculatePagination](#calculatepagination)
  - [validateEnv](#validateenv)
- [Cloudinary Helper](#-cloudinary-helper)
- [Razorpay Helper](#-razorpay-helper)
- [Stripe Helper](#-stripe-helper)
- [Gmail Helper](#-gmail-helper)
- [Brevo Helper](#-brevo-helper)
- [Frontend Package](#-frontend-package)
- [Author](#-author)

---

## 🚀 Quick Start

Create a new backend project:

```bash
npx devil-backend-nodejs my-app
```

> Interactive prompts will appear — select Cloudinary, Email, Payment gateway as needed.

---

## ⚡ CLI Flags (Skip Prompts)

Use flags directly to scaffold without interactive prompts:

```bash
# Single flags
npx devil-backend-nodejs my-app --cloudinary
npx devil-backend-nodejs my-app --email-gmail
npx devil-backend-nodejs my-app --email-brevo
npx devil-backend-nodejs my-app --razorpay
npx devil-backend-nodejs my-app --stripe
npx devil-backend-nodejs my-app --docker

# Multiple flags together
npx devil-backend-nodejs my-app --cloudinary --email-brevo --razorpay --docker

# Skip npm install
npx devil-backend-nodejs my-app --no-install

# Help menu
npx devil-backend-nodejs --help
```

### Available Flags

| Flag            | Description                                      |
|-----------------|--------------------------------------------------|
| `--cloudinary`  | Add Cloudinary file upload + .env variables      |
| `--email-gmail` | Add Gmail SMTP setup + .env variables            |
| `--email-brevo` | Add Brevo email setup + .env variables           |
| `--razorpay`    | Add Razorpay payment setup + .env variables      |
| `--stripe`      | Add Stripe payment setup + .env variables        |
| `--docker`      | Add Docker + docker-compose support              |
| `--no-install`  | Skip npm install after scaffolding               |
| `--help, -h`    | Show help menu                                   |

---

## 📁 Generated Project Structure

```
my-app/
├── src/
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection
│   │   └── constants.js             ← App constants
│   ├── controllers/
│   │   └── authController.js        ← Auth logic
│   ├── middleware/
│   │   ├── authMiddleware.js         ← JWT verify
│   │   ├── errorHandlerMiddleware.js ← Global error handler
│   │   ├── rateLimiter.js            ← Rate limiting
│   │   └── roleCheckMiddleware.js    ← Role-based access
│   ├── models/
│   │   └── userModel.js             ← User schema
│   ├── routes/
│   │   ├── authRoutes.js            ← Auth routes
│   │   └── index.js                 ← Route aggregator
│   ├── utils/
│   │   ├── ApiError.js              ← Custom error class
│   │   ├── ApiResponse.js           ← Standard response class
│   │   └── generateToken.js         ← JWT token generator
│   └── validators/
│       └── authValidator.js         ← Input validation rules
├── app.js                           ← Express app setup
├── server.js                        ← Server entry point
├── .env                             ← Environment variables
└── package.json
```

---

## 📦 Install as Package

```bash
npm install devil-backend-nodejs
```

---

## 🛠️ Backend Utilities

Import the helpers you need:

```js
const {
  asyncHandler,
  paginate,
  ApiError,
  ApiResponse,
  generateToken,
  generateOTP,
  randomString,
  slugify,
  capitalize,
  capitalizeWords,
  formatDate,
  timeAgo,
  pick,
  exclude,
  isEmptyObject,
  calculatePagination,
  validateEnv,
} = require('devil-backend-nodejs');
```

---

### `asyncHandler`

**What it does:** Wraps async controller functions with try/catch. Unhandled promise rejections are automatically forwarded to Express error handler.

```js
const { asyncHandler } = require('devil-backend-nodejs');

// Without asyncHandler ❌
router.get('/user', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// With asyncHandler ✅
router.get('/user', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));
```

---

### `paginate`

**What it does:** Applies pagination to any Mongoose model. Supports `page`, `limit`, `sort`, and `populate` options.

**Function Signature:**

```js
const paginate = async (Model, query = {}, options = {}) => { ... }
```

**Options:**

| Option     | Type             | Default | Description                          |
|------------|------------------|---------|--------------------------------------|
| `page`     | `Number`         | `1`     | Current page number                  |
| `limit`    | `Number`         | `10`    | Number of documents per page         |
| `sort`     | `Object/String`  | —       | Sort order e.g. `{ createdAt: -1 }`  |
| `populate` | `String/Object`  | —       | Mongoose populate (e.g. `'category'`)|

**Returns:**

```js
{
  data: [...],           // Array of documents for current page
  pagination: {
    total: 100,          // Total matching documents
    page: 1,             // Current page
    limit: 10,           // Items per page
    totalPages: 10       // Total number of pages
  }
}
```

**Usage Examples:**

```js
const { paginate, ApiResponse, asyncHandler } = require('devil-backend-nodejs');

// Basic pagination
router.get('/products', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await paginate(Product, {}, { page, limit });

  res.json(new ApiResponse(200, result, 'Products fetched'));
}));


// With search filter + sort
router.get('/products', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  const query = search
    ? { name: { $regex: search, $options: 'i' } }
    : {};

  const result = await paginate(Product, query, {
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },   // newest first
  });

  res.json(new ApiResponse(200, result, 'Products fetched'));
}));


// With populate (join related documents)
router.get('/orders', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await paginate(Order, { user: req.user._id }, {
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },
    populate: 'product',    // populate product field
  });

  res.json(new ApiResponse(200, result, 'Orders fetched'));
}));


// Full example with search + sort + populate
router.get('/blogs', asyncHandler(async (req, res) => {
  const { page = 1, limit = 5, search = '', category } = req.query;

  const query = {};
  if (search)   query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;

  const result = await paginate(Blog, query, {
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },
    populate: { path: 'author', select: 'name email' },
  });

  res.json(new ApiResponse(200, result, 'Blogs fetched'));
}));
```

**Response Structure:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Products fetched",
  "data": {
    "data": [
      { "_id": "...", "name": "Product A", "price": 499 },
      { "_id": "...", "name": "Product B", "price": 299 }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

### `ApiError`

**What it does:** Throws a structured error response. The global error handler catches it automatically.

```js
const { ApiError } = require('devil-backend-nodejs');

// Common status codes
throw new ApiError(400, 'Invalid input data');
throw new ApiError(401, 'Unauthorized — please login');
throw new ApiError(403, 'Forbidden — you do not have access');
throw new ApiError(404, 'User not found');
throw new ApiError(500, 'Internal server error');

// With validation errors array
throw new ApiError(422, 'Validation failed', [
  { field: 'email', message: 'Invalid email format' },
  { field: 'password', message: 'Password must be at least 8 characters' }
]);

// Inside a controller
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, user, 'User fetched'));
});
```

---

### `ApiResponse`

**What it does:** Creates a consistent success response format across all API endpoints.

```js
const { ApiResponse } = require('devil-backend-nodejs');

// Syntax: new ApiResponse(statusCode, data, message)
res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
res.status(201).json(new ApiResponse(201, newProduct, 'Product created'));
res.status(200).json(new ApiResponse(200, null, 'Password reset email sent'));

// Response format:
// {
//   "statusCode": 200,
//   "success": true,
//   "message": "User fetched successfully",
//   "data": { ... }
// }
```

---

### `generateToken`

**What it does:** Generates a signed JWT token using the `JWT_SECRET` from your `.env` file.

```js
const { generateToken } = require('devil-backend-nodejs');

// Basic usage
const token = generateToken(user._id);

// With custom expiry
const token = generateToken(user._id, '7d');   // valid for 7 days
const token = generateToken(user._id, '1h');   // valid for 1 hour
const token = generateToken(user._id, '30d');  // valid for 30 days

// Login controller example
const loginUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.comparePassword(req.body.password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  const token = generateToken(user._id);

  res
    .cookie('token', token, { httpOnly: true, secure: true })
    .json(new ApiResponse(200, { user, token }, 'Login successful'));
});
```

> **Note:** Set `JWT_SECRET` and `JWT_EXPIRES_IN` in your `.env` file.

---

### `generateOTP`

**What it does:** Generates a 6-digit numeric OTP string. Used for phone/email verification.

```js
const { generateOTP } = require('devil-backend-nodejs');

const otp = generateOTP();
// Output: "483921"  (always a 6-digit string)

// Save OTP and send via email
const sendOTPController = asyncHandler(async (req, res) => {
  const otp = generateOTP();

  await User.findByIdAndUpdate(req.user._id, {
    otp,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  await sendOTPGmail(req.user.email, otp);
  res.json(new ApiResponse(200, null, 'OTP sent to your email'));
});
```

---

### `randomString`

**What it does:** Generates a random alphanumeric string. Useful for tokens, unique codes, and temporary passwords.

```js
const { randomString } = require('devil-backend-nodejs');

const token = randomString();       // default: 32 characters
const shortCode = randomString(8);  // 8 characters
const apiKey = randomString(64);    // 64 characters

// Password reset token
const resetToken = randomString(40);
user.passwordResetToken = resetToken;
user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
await user.save();
```

---

### `slugify`

**What it does:** Converts any text into a URL-friendly slug. Useful for blog posts and product URLs.

```js
const { slugify } = require('devil-backend-nodejs');

slugify('Hello World')            // → "hello-world"
slugify('My Blog Post Title!')    // → "my-blog-post-title"
slugify('  Spaces   Everywhere ') // → "spaces-everywhere"
slugify('Price: ₹499')            // → "price-499"

// Auto-generate slug in Mongoose pre-save hook
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});
```

---

### `capitalize` & `capitalizeWords`

**What it does:** Capitalizes the first letter of a string (`capitalize`) or every word (`capitalizeWords`).

```js
const { capitalize, capitalizeWords } = require('devil-backend-nodejs');

capitalize('hello world')         // → "Hello world"
capitalize('sachin tiwari')       // → "Sachin tiwari"

capitalizeWords('hello world')    // → "Hello World"
capitalizeWords('sachin tiwari')  // → "Sachin Tiwari"
capitalizeWords('john doe smith') // → "John Doe Smith"
```

---

### `formatDate` & `timeAgo`

**What it does:** Converts a date into a human-readable string (`formatDate`) or a relative time like "2 days ago" (`timeAgo`).

```js
const { formatDate, timeAgo } = require('devil-backend-nodejs');

// formatDate
formatDate(new Date())                // → "02 Apr 2026"
formatDate('2026-01-15')              // → "15 Jan 2026"
formatDate(new Date(), 'DD/MM/YYYY')  // → "02/04/2026"

// timeAgo
timeAgo('2026-04-01')  // → "1 day ago"
timeAgo('2026-03-01')  // → "1 month ago"
timeAgo('2025-04-02')  // → "1 year ago"
timeAgo(new Date(Date.now() - 5 * 60 * 1000)) // → "5 minutes ago"

// Use in API response
const post = await Post.findById(id);
res.json(new ApiResponse(200, {
  ...post.toObject(),
  createdAtFormatted: formatDate(post.createdAt),
  postedAgo: timeAgo(post.createdAt),
}, 'Post fetched'));
```

---

### `pick` & `exclude`

**What it does:** `pick` extracts only specified fields from an object. `exclude` removes specified fields from an object.

```js
const { pick, exclude } = require('devil-backend-nodejs');

const body = { name: 'Sachin', email: 'sachin@gmail.com', password: '123', role: 'admin' };

// pick — keep only these fields
pick(body, ['name', 'email'])
// → { name: 'Sachin', email: 'sachin@gmail.com' }

// exclude — remove these fields
exclude(body, ['password', 'role'])
// → { name: 'Sachin', email: 'sachin@gmail.com' }

// Return safe user data (hide sensitive fields)
const user = await User.findById(id);
const safeUser = exclude(user.toObject(), ['password', '__v', 'otp', 'otpExpires']);
res.json(new ApiResponse(200, safeUser, 'User fetched'));
```

---

### `isEmptyObject`

**What it does:** Returns `true` if the given value is an empty object, null, or empty array.

```js
const { isEmptyObject } = require('devil-backend-nodejs');

isEmptyObject({})                  // → true
isEmptyObject({ name: 'Sachin' }) // → false
isEmptyObject(null)                // → true
isEmptyObject([])                  // → true

// Prevent empty update requests
const updateProfile = asyncHandler(async (req, res) => {
  if (isEmptyObject(req.body)) {
    throw new ApiError(400, 'Nothing to update — please provide some data');
  }
  const updated = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
  res.json(new ApiResponse(200, updated, 'Profile updated'));
});
```

---

### `calculatePagination`

**What it does:** Calculates pagination metadata manually — useful when you run your own `.find()` query instead of using `paginate()`.

```js
const { calculatePagination } = require('devil-backend-nodejs');

// calculatePagination(totalDocs, currentPage, limitPerPage)
const meta = calculatePagination(100, 2, 10);

// Returns:
// {
//   totalDocs: 100,
//   totalPages: 10,
//   page: 2,
//   limit: 10,
//   hasNextPage: true,
//   hasPrevPage: true,
//   nextPage: 3,
//   prevPage: 1
// }

// Example with manual query
const products = await Product.find(filter).skip((page - 1) * limit).limit(limit);
const totalDocs = await Product.countDocuments(filter);
const pagination = calculatePagination(totalDocs, page, limit);

res.json(new ApiResponse(200, { products, pagination }, 'Products fetched'));
```

> **`paginate` vs `calculatePagination`:**
> Use `paginate()` when you want an all-in-one solution.
> Use `calculatePagination()` when you run a custom query and just need the pagination metadata.

---

### `validateEnv`

**What it does:** Validates required environment variables at server startup. Throws an error and stops the server if any variable is missing.

```js
const { validateEnv } = require('devil-backend-nodejs');

// Place at the top of server.js
validateEnv(['MONGO_URI', 'JWT_SECRET', 'PORT']);

// Include service-specific variables
validateEnv([
  'MONGO_URI',
  'JWT_SECRET',
  'PORT',
  'CLOUDINARY_CLOUD_NAME',   // if using Cloudinary
  'CLOUDINARY_API_KEY',
  'RAZORPAY_KEY_ID',         // if using Razorpay
]);

// Error output if missing:
// ❌ Missing required env variable: MONGO_URI
```

---

## ☁️ Cloudinary Helper

### Setup

Add to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Import

```js
const {
  uploadToCloudinary,
  uploadImageToCloudinary,
  deleteFromCloudinary,
  getCloudinary,
} = require('devil-backend-nodejs');
```

### Functions

| Function                  | Description                              | Returns                          |
|---------------------------|------------------------------------------|----------------------------------|
| `uploadToCloudinary`      | Upload any file (PDF, doc, video, etc.)  | `{ url, publicId, name }`        |
| `uploadImageToCloudinary` | Upload & auto-optimize images            | `{ url, publicId, name }`        |
| `deleteFromCloudinary`    | Delete a file by its publicId            | `{ result: 'ok' }`               |
| `getCloudinary`           | Get the raw Cloudinary SDK instance      | Cloudinary instance              |

```js
const {
  uploadToCloudinary,
  uploadImageToCloudinary,
  deleteFromCloudinary,
} = require('devil-backend-nodejs');

// Upload any file (use multer for req.file)
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const result = await uploadToCloudinary(
    req.file.buffer,          // file buffer from multer
    req.file.originalname,    // original file name
    req.file.mimetype,        // MIME type
    'documents'               // Cloudinary folder name
  );

  res.json(new ApiResponse(201, result, 'File uploaded successfully'));
  // result: { url: "https://res.cloudinary.com/...", publicId: "documents/abc123", name: "file.pdf" }
});


// Upload and optimize an image
const uploadAvatar = asyncHandler(async (req, res) => {
  const result = await uploadImageToCloudinary(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    'avatars'
  );

  await User.findByIdAndUpdate(req.user._id, {
    avatar: result.url,
    avatarPublicId: result.publicId,
  });

  res.json(new ApiResponse(200, result, 'Avatar updated successfully'));
});


// Delete a file
const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  await deleteFromCloudinary(publicId);
  res.json(new ApiResponse(200, null, 'File deleted successfully'));
});
```

---

## 💳 Razorpay Helper

### Setup

Add to your `.env` file:

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### Import

```js
const { createOrder, verifyPayment, getRazorpay } = require('devil-backend-nodejs');
```

### Functions

| Function        | Parameters                              | Description                        |
|-----------------|-----------------------------------------|------------------------------------|
| `createOrder`   | `(amount, currency)`                    | Create a new Razorpay order        |
| `verifyPayment` | `(orderId, paymentId, signature)`       | Verify payment signature           |
| `getRazorpay`   | `()`                                    | Get the raw Razorpay SDK instance  |

```js
// Step 1: Create order (backend)
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  // amount must be in paise (₹499 = 49900)

  const order = await createOrder(amount, currency);

  res.json(new ApiResponse(200, order, 'Order created'));
  // order: { id: "order_xxx", amount: 49900, currency: "INR", ... }
});


// Step 2: Verify payment after frontend completes payment
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = verifyPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) throw new ApiError(400, 'Payment verification failed');

  await Order.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    { paymentStatus: 'paid', razorpayPaymentId: razorpay_payment_id }
  );

  res.json(new ApiResponse(200, null, 'Payment verified successfully'));
});
```

---

## 💰 Stripe Helper

### Setup

Add to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Import

```js
const { createPaymentIntent, constructWebhookEvent, getStripe } = require('devil-backend-nodejs');
```

### Functions

| Function                 | Parameters                   | Description                       |
|--------------------------|------------------------------|-----------------------------------|
| `createPaymentIntent`    | `(amount, currency)`         | Create a Stripe payment intent    |
| `constructWebhookEvent`  | `(body, signature)`          | Verify and parse a webhook event  |
| `getStripe`              | `()`                         | Get the raw Stripe SDK instance   |

```js
// Create payment intent
const createIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'inr' } = req.body;
  // amount in smallest unit (₹499 = 49900 paise)

  const intent = await createPaymentIntent(amount, currency);

  res.json(new ApiResponse(200, {
    clientSecret: intent.client_secret,
  }, 'Payment intent created'));
});


// Handle Stripe webhook
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = constructWebhookEvent(req.body, sig);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await Order.findOneAndUpdate(
        { stripePaymentId: event.data.object.id },
        { paymentStatus: 'paid' }
      );
      break;

    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
  }

  res.json({ received: true });
});
```

---

## 📧 Gmail Helper

### Setup

Add to your `.env` file:

```env
GMAIL_USER=youremail@gmail.com
GMAIL_PASS=your_app_password
```

> **Important:** Generate an **App Password** from your Google Account (not your actual Gmail password).
> Path: Google Account → Security → 2-Step Verification → App Passwords

### Import

```js
const { sendGmail, sendOTPGmail, sendWelcomeGmail } = require('devil-backend-nodejs');
```

### Functions

| Function           | Parameters               | Description                           |
|--------------------|--------------------------|---------------------------------------|
| `sendGmail`        | `(to, subject, htmlBody)`| Send a custom HTML email via Gmail    |
| `sendOTPGmail`     | `(to, otp)`              | Send a pre-designed OTP email         |
| `sendWelcomeGmail` | `(to, name)`             | Send a welcome email to a new user    |

```js
// Send a custom email
await sendGmail(
  'user@example.com',
  'Your Order is Confirmed',
  '<h1>Order Confirmed!</h1><p>Your order #12345 has been placed successfully.</p>'
);


// Send OTP email
const sendOTPController = asyncHandler(async (req, res) => {
  const otp = generateOTP();

  await User.findByIdAndUpdate(req.user._id, {
    otp,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  await sendOTPGmail(req.user.email, otp);
  res.json(new ApiResponse(200, null, 'OTP sent to your email'));
});


// Send welcome email after registration
const registerUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  await sendWelcomeGmail(user.email, user.name);
  res.status(201).json(new ApiResponse(201, user, 'Registration successful'));
});
```

---

## 📩 Brevo (Sendinblue) Helper

### Setup

Add to your `.env` file:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Your App Name
```

### Import

```js
const { sendBrevo, sendOTPBrevo, sendWelcomeBrevo } = require('devil-backend-nodejs');
```

### Functions

| Function            | Parameters                | Description                             |
|---------------------|---------------------------|-----------------------------------------|
| `sendBrevo`         | `(to, subject, htmlBody)` | Send a custom HTML email via Brevo      |
| `sendOTPBrevo`      | `(to, otp)`               | Send a pre-designed OTP email via Brevo |
| `sendWelcomeBrevo`  | `(to, name)`              | Send a welcome email via Brevo          |

```js
// Send a custom email via Brevo
await sendBrevo(
  'user@example.com',
  'Invoice Generated',
  '<h2>Your Invoice</h2><p>Please find your invoice attached.</p>'
);


// Send OTP via Brevo
const verifyEmailController = asyncHandler(async (req, res) => {
  const otp = generateOTP();

  await User.findByIdAndUpdate(req.user._id, {
    otp,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOTPBrevo(req.user.email, otp);
  res.json(new ApiResponse(200, null, 'OTP sent via Brevo'));
});


// Send welcome email via Brevo
await sendWelcomeBrevo(user.email, user.name);
```

> **Gmail vs Brevo:** Gmail is ideal for personal or small projects. For production apps with bulk email sending, use Brevo (500 free emails/day, better deliverability).

---

## ⚛️ Frontend Package

For React hooks and frontend utilities, use the companion package:

```bash
npm install devil-frontend
```

[![npm](https://img.shields.io/npm/v/devil-frontend)](https://www.npmjs.com/package/devil-frontend)

---

## 👤 Author

**Sachin Tiwari**

- GitHub: [@Sachint122](https://github.com/Sachint122)
- npm: [devil-backend-nodejs](https://www.npmjs.com/package/devil-backend-nodejs)

---

## 📄 License

MIT © Sachin Tiwari
