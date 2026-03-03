const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ================= UTIL ================= */
const recalculateCart = (cart) => {
  let subtotal = 0;
  let totalItems = 0;

  cart.items.forEach((item) => {
    subtotal += item.priceAtAdd * item.quantity;
    totalItems += item.quantity;
  });

  cart.subtotal = subtotal;
  cart.totalItems = totalItems;
};

/* ================= GET CART ================= */
exports.getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate(
    "items.productId"
  );

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);

  if (!product || !product.isVisible) {
    throw new Error("Product not available");
  }

  if (product.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      priceAtAdd: product.pricing.finalPrice,
    });
  }

  recalculateCart(cart);
  await cart.save();

  return cart;
};

/* ================= UPDATE QUANTITY ================= */
exports.updateQuantity = async (userId, productId, quantity) => {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find(
    (i) => i.productId.toString() === productId
  );

  if (!item) throw new Error("Item not found in cart");

  item.quantity = quantity;
  recalculateCart(cart);
  await cart.save();

  return cart;
};

/* ================= REMOVE ITEM ================= */
exports.removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId
  );

  recalculateCart(cart);
  await cart.save();

  return cart;
};

/* ================= CLEAR CART ================= */
exports.clearCart = async (userId) => {
  return Cart.findOneAndUpdate(
    { userId },
    { items: [], subtotal: 0, totalItems: 0 },
    { new: true }
  );
};
