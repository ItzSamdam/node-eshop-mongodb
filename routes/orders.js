const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

router.get(`/`, async (request, response) => {
    const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });

    if (!orderList) {
        response.status(500).json({ success: false })
    }
    response.send(orderList);
})

router.get(`/:id`, async (request, response) => {
    const order = await Order.findById(request.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'
            }
        });

    if (!order) {
        response.status(500).json({ success: false })
    }
    response.send(order);
})

router.post('/', async (request, response) => {
    const orderItemsIds = Promise.all(request.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: request.body.shippingAddress1,
        shippingAddress2: request.body.shippingAddress2,
        city: request.body.city,
        zip: request.body.zip,
        country: request.body.country,
        phone: request.body.phone,
        status: request.body.status,
        totalPrice: totalPrice,
        user: request.body.user,
    })
    order = await order.save();

    if (!order)
        return response.status(400).send('the order cannot be created!')

    response.send(order);
})


router.put('/:id', async (request, response) => {
    const order = await Order.findByIdAndUpdate(
        request.params.id,
        {
            status: request.body.status
        },
        { new: true }
    )

    if (!order)
        return response.status(400).send('the order cannot be update!')

    response.send(order);
})


router.delete('/:id', (request, response) => {
    Order.findByIdAndRemove(request.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return response.status(200).json({ success: true, message: 'the order is deleted!' })
        } else {
            return response.status(404).json({ success: false, message: "order not found!" })
        }
    }).catch(err => {
        return response.status(500).json({ success: false, error: err })
    })
})

router.get('/get/totalsales', async (request, response) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return response.status(400).send('The order sales cannot be generated')
    }

    response.send({ totalsales: totalSales.pop().totalsales })
})

router.get(`/get/count`, async (request, response) => {
    const orderCount = await Order.countDocuments((count) => count)

    if (!orderCount) {
        response.status(500).json({ success: false })
    }
    response.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (request, response) => {
    const userOrderList = await Order.find({ user: request.params.userid }).populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
        response.status(500).json({ success: false })
    }
    response.send(userOrderList);
})



module.exports = router;