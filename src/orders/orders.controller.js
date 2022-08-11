const path = require("path");

// Use the existing dishes data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//MIDDLEWARE
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function orderDataHas(prop) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if(data[prop] ) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${prop}` });
  }
}

function validateId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (orderId === id || !id) {
      return next();
  }
  next({
      status: 400,
      message: `body id: ${id} does not match param id: ${orderId}`
  });
}

function validateDishesArray(req, res, next) {
  const { data: { dishes } } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({status: 400, message: "Order must include at least one dish"});
}

function validateQuantity(req, res, next) {
  const { data: { dishes } } = req.body;
  let passNum = 0;
  let failIndex = 0;
  for (let i = 0; i < dishes.length; i++) {
    const { quantity = undefined } = dishes[i];
    if (quantity && Number.isInteger(quantity) && quantity > 0) {
      passNum++;
    }
    failIndex = i;
  }
  if (passNum === dishes.length){
    return next();
  }
  return next({status: 400, message: `Dish ${failIndex} must have a quantity that is an integer greater than 0`});
}

function validateUpdateStatus(req, res, next) {
  const { data: { status } } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"]
  if (validStatuses.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
  })
}

function validateDeleteStatus(req, res, next) {
  const { orderId } = req.params;
  const orderToDelete = orders.find((order) => order.id == orderId);
  if (orderToDelete.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending"
  })
}

//REGULAR FUNCTIONS

function list(req, res, next) {
  res.send({data: orders});
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res, next){
  const { data: { deliverTo, mobileNumber, dishes } } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  }

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const order = res.locals.order;

  const { data: { deliverTo, mobileNumber, dishes, quantity} ={} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  order.quantity = quantity;

  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
    list,
    create: [
      orderDataHas("deliverTo"), 
      orderDataHas("mobileNumber"), 
      orderDataHas("dishes"),
      validateDishesArray,
      validateQuantity, 
      create
    ],
    read: [orderExists, read],
    update: [
      orderExists, 
      orderDataHas("deliverTo"), 
      orderDataHas("mobileNumber"), 
      orderDataHas("dishes"), 
      orderDataHas("status"),
      validateDishesArray,
      validateQuantity,
      validateId,
      validateUpdateStatus,
      update
    ],
    delete: [orderExists, orderExists, validateDeleteStatus, destroy]
}