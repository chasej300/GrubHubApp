const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        next();
    }
    else{
        next({
            status: 404,
            message: `Dish does not exist: ${dishId}`,
        });
    }
}

function dishDataHas(prop) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[prop]) {
        return next();
        }
        next({ status: 400, message: `Dish must include a ${prop}` });
    }
}

function validateId(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;

    if (dishId === id || !id) {
        return next();
    }
    next({
        status: 400,
        message: `body id: ${id} does not match param id: ${dishId}`
    });
}
  
function validatePrice(req, res, next) {
    const { data: { price } } = req.body;
    if (price > 0 && Number.isInteger(price)) {
      return next();
    }
    next({status: 400, message: "Dish must have a price that is an integer greater than 0"});
}

//FUNCTIONS
function list(req, res) {
    res.send({data: dishes});
}

function read(req, res) {
    const { dishId } = req.params;
    const dishUrl = dishes.find((dish) => (dish.id === dishId));
    res.json({data: res.locals.dish});
}

function create(req, res){
    const { data: { name, price, description, image_url } } = req.body;

    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url
    }

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function update(req, res) {
    const dish = res.locals.dish
    const { data: { name, price, description, image_url } = {} } = req.body;
  
    dish.name = name;
    dish.price = price;
    dish.description = description;
    dish.image_url = image_url;
    dish.price = price;
  
    res.json({ data: dish });
}

module.exports = {
    list,
    create: [
        dishDataHas("name"), 
        dishDataHas("description"), 
        dishDataHas("image_url"), 
        dishDataHas("price"), 
        validatePrice,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists, 
        dishDataHas("name"), 
        dishDataHas("description"), 
        dishDataHas("image_url"), 
        dishDataHas("price"), 
        validatePrice,
        validateId,
        update
    ],
}