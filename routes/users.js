const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/`, async (request, response) => {
    const userList = await User.find().select('-passwordHash');

    if (!userList) {
        response.status(500).json({ success: false })
    }
    response.send(userList);
})

router.get('/:id', async (request, response) => {
    const user = await User.findById(request.params.id).select('-passwordHash');

    if (!user) {
        response.status(500).json({ message: 'The user with the given ID was not found.' })
    }
    response.status(200).send(user);
})

router.post('/', async (request, response) => {
    let user = new User({
        name: request.body.name,
        email: request.body.email,
        passwordHash: bcrypt.hashSync(request.body.password, 10),
        phone: request.body.phone,
        isAdmin: request.body.isAdmin,
        street: request.body.street,
        apartment: request.body.apartment,
        zip: request.body.zip,
        city: request.body.city,
        country: request.body.country,
    })
    user = await user.save();

    if (!user)
        return response.status(400).send('the user cannot be created!')

    response.send(user);
})

router.put('/:id', async (request, response) => {

    const userExist = await User.findById(request.params.id);
    let newPassword
    if (request.body.password) {
        newPassword = bcrypt.hashSync(request.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        request.params.id,
        {
            name: request.body.name,
            email: request.body.email,
            passwordHash: newPassword,
            phone: request.body.phone,
            isAdmin: request.body.isAdmin,
            street: request.body.street,
            apartment: request.body.apartment,
            zip: request.body.zip,
            city: request.body.city,
            country: request.body.country,
        },
        { new: true }
    )

    if (!user)
        return response.status(400).send('the user cannot be created!')

    response.send(user);
})

router.post('/login', async (request, response) => {
    const user = await User.findOne({ email: request.body.email })
    const secret = process.env.secret;
    if (!user) {
        return response.status(400).send('The user not found');
    }

    if (user && bcrypt.compareSync(request.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            { expiresIn: '1d' }
        )

        response.status(200).send({ user: user.email, token: token })
    } else {
        response.status(400).send('password is wrong!');
    }


})


router.post('/register', async (request, response) => {
    let user = new User({
        name: request.body.name,
        email: request.body.email,
        passwordHash: bcrypt.hashSync(request.body.password, 10),
        phone: request.body.phone,
        isAdmin: request.body.isAdmin,
        street: request.body.street,
        apartment: request.body.apartment,
        zip: request.body.zip,
        city: request.body.city,
        country: request.body.country,
    })
    user = await user.save();

    if (!user)
        return response.status(400).send('the user cannot be created!')

    response.send(user);
})


router.delete('/:id', (request, response) => {
    User.findByIdAndRemove(request.params.id).then(user => {
        if (user) {
            return response.status(200).json({ success: true, message: 'the user is deleted!' })
        } else {
            return response.status(404).json({ success: false, message: "user not found!" })
        }
    }).catch(err => {
        return response.status(500).json({ success: false, error: err })
    })
})

router.get(`/get/count`, async (request, response) => {
    const userCount = await User.countDocuments((count) => count)

    if (!userCount) {
        response.status(500).json({ success: false })
    }
    response.send({
        userCount: userCount
    });
})


module.exports = router;