const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const { createOrder } = require("./order.service");

exports.cartCheckout = async ({ userId, couponCode, shippingAddress }) => {
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.productId);

    if (!product) continue;

    const price = product.pricing.finalPrice;
    const total = price * item.quantity;

    subtotal += total;

    items.push({
      productId: product._id,
      vendorId: product.vendorId,
      name: product.name,
      image: product.images?.[0],
      price,
      quantity: item.quantity,
      totalPrice: total,
    });
  }

  /* ===== COUPON ===== */
  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) throw new Error("Invalid coupon");

    discount =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;

    appliedCoupon = {
      code: coupon.code,
      discountAmount: discount,
    };
  }

  const totalAmount = subtotal - discount;

  const order = await Order.create({
    userId,
    items,
    pricing: {
      subtotal,
      discount,
      totalAmount,
    },
    coupon: appliedCoupon,
    shippingAddress,
    orderStatus: "placed",
  });

  // 🔥 CLEAR CART
  await Cart.findOneAndUpdate({ userId }, { items: [], subtotal: 0 });

  return order;
};

exports.buyNowCheckout = async ({
  userId,
  productId,
  quantity,
  shippingAddress,
  paymentMethod = "razorpay",
}) => {
  if (!productId || !quantity) {
    throw new Error("ProductId & quantity required");
  }

  return await createOrder({
    customerId: userId,
    items: [
      {
        productId,
        quantity,
      },
    ],
    shippingAddress,
    paymentMethod,
    notes: "Buy Now Order",
  });
};

exports.buyNowSummary = async ({
  productId,
  quantity,
  couponCode,
}) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const price = product.pricing.finalPrice;
  const subtotal = price * quantity;

  let discount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) throw new Error("Invalid coupon");

    discount =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
  }

  const tax = 0;
  const shippingFee = 0;
  const totalAmount = subtotal - discount + tax + shippingFee;

  return {
    subtotal,
    discount,
    tax,
    shippingFee,
    totalAmount,
  };
};

exports.cartSummary = async ({ userId, couponCode }) => {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  let subtotal = 0;

  for (const item of cart.items) {
    subtotal += item.productId.pricing.finalPrice * item.quantity;
  }

  let discount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) throw new Error("Invalid coupon");

    discount =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
  }

  const tax = 0;
  const shippingFee = 0;
  const totalAmount = subtotal - discount + tax + shippingFee;

  return {
    subtotal,
    discount,
    tax,
    shippingFee,
    totalAmount,
  };
};
