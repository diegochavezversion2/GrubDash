const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function isStatusPending(req, res, next) {
    const order = res.locals.order;
    if(order.status === "pending") {
        return next();
    }
    next({ status: 400, message: `An order cannot be deleted unless it is pending.`})
}

function isStatusDelivered(req, res, next) {
    const { data: { status } = {} } = req.body;
    if(status !== "delivered") {
        return next();
    }
    next({ status: 400, message: `A delivered order cannot be changed.`})
}

function statusPropertyIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (status && validStatus.includes(status)) {
      return next();
    }
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
}

function bodyDataKeyHasValue(value) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[value].length > 0) {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${value}`,
        })
    }
}

function isDishValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if (dishes.length === 0 || !Array.isArray(dishes)) {
        next({
            status: 400,
            message: `Order must include at least one dish`,
        });
    }
    return next();
}

function dishesQuantityIsValid(req, res, next) {
    const { data: {dishes} = {} } = req.body;
    const index = dishes.findIndex((dish) => {
        if(!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)){
            return true;
        }
    })
    if(index >= 0) {
        return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
    }
    return next();
}

function orderExists(req, res, next) {
    const orderId = (req.params.orderId);
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder
      return next();
    }
    next({
      status: 404,
      message: `Order id not found: ${req.params.orderId}`,
    });
}

function doIdsMatch(req, res, next) {
    const orderId = req.params.orderId
    const { data = {} } = req.body;
    if (data.id) {
        if (data.id === orderId) {
            return next();
        } else {
            return next({ status: 400, message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}` })
        }
    } 
    next();
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo,
      mobileNumber,
      status,
      dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function list(req, res) {
    res.json({ data: orders });
}

function update(req, res) {
    const order = res.locals.order;
  
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
  
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
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataKeyHasValue("deliverTo"),
        bodyDataKeyHasValue("mobileNumber"),
        isDishValid,
        dishesQuantityIsValid,
        create
    ],
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataKeyHasValue("deliverTo"),
        bodyDataKeyHasValue("mobileNumber"),
        bodyDataKeyHasValue("dishes"),
        statusPropertyIsValid,
        isStatusDelivered,
        isDishValid,
        dishesQuantityIsValid,
        doIdsMatch,
        update
    ],
    list,
    delete: [orderExists, isStatusPending, destroy]
  };