const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function isPriceValid(req, res, next){
    const { data: {price} = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
}

function dishExists(req, res, next) {
    const dishId = (req.params.dishId);
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${req.params.dishId}`,
    });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

function doIdsMatch(req, res, next) {
    const dishId = req.params.dishId
    const { data = {} } = req.body;
    if (data.id) {
        if (data.id === dishId) {
            return next();
        } else {
            return next({ status: 400, message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}` })
        }
    } 
    next();
}

function bodyDataKeyHasValue(value) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[value].length > 0) {
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${value}`,
        })
    }
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: nextId(),
      name,
      description,
      price,
      image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function list(req, res) {
    res.json({ data: dishes });
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const dish = res.locals.dish;
  
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
  
    res.json({ data: dish });
}

// PERSONAL TODO - verifyer for req.body id === dishId, verifyer for number in "price", check that bodyDataKeyHasValue is working 

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        bodyDataKeyHasValue("name"),
        bodyDataKeyHasValue("description"),
        bodyDataKeyHasValue("image_url"),
        isPriceValid,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        bodyDataKeyHasValue("name"),
        bodyDataKeyHasValue("description"),
        bodyDataKeyHasValue("image_url"),
        isPriceValid,
        doIdsMatch,
        update
    ],
    list
}