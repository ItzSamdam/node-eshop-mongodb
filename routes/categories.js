const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();

router.get(`/`, async (request, response) => {
    const categoryList = await Category.find();

    if (!categoryList) {
        response.status(500).json({ success: false })
    }
    response.status(200).send(categoryList);
})

router.get('/:id', async (reqquest, response) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        response.status(500).json({ message: 'The category with the given ID was not found.' })
    }
    response.status(200).send(category);
})



router.post('/', async (request, response) => {
    let category = new Category({
        name: request.body.name,
        icon: request.body.icon,
        color: request.body.color
    })
    category = await category.save();

    if (!category)
        return response.status(400).send('the category cannot be created!')

    response.send(category);
})


router.put('/:id', async (request, response) => {
    const category = await Category.findByIdAndUpdate(
        request.params.id,
        {
            name: request.body.name,
            icon: request.body.icon || category.icon,
            color: request.body.color,
        },
        { new: true }
    )

    if (!category)
        return response.status(400).send('the category cannot be created!')

    response.send(category);
})

router.delete('/:id', (request, response) => {
    Category.findByIdAndRemove(request.params.id).then(category => {
        if (category) {
            return response.status(200).json({ success: true, message: 'the category is deleted!' })
        } else {
            return response.status(404).json({ success: false, message: "category not found!" })
        }
    }).catch(error => {
        return response.status(500).json({ success: false, error: error })
    })
})

module.exports = router;