const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (request, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (request, file, cb) {

        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`, async (request, response) => {
    let filter = {};
    if (request.query.categories) {
        filter = { category: request.query.categories.split(',') }
    }

    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        response.status(500).json({ success: false })
    }
    response.send(productList);
})

router.get(`/:id`, async (request, response) => {
    const product = await Product.findById(request.params.id).populate('category');

    if (!product) {
        response.status(500).json({ success: false })
    }
    response.send(product);
})

router.post(`/`, uploadOptions.single('image'), async (request, response) => {
    const category = await Category.findById(request.body.category);
    if (!category) return response.status(400).send('Invalid Category')

    const file = request.file;
    if (!file) return response.status(400).send('No image in the request')

    const fileName = file.filename
    const basePath = `${request.protocol}://${request.get('host')}/public/uploads/`;
    let product = new Product({
        name: request.body.name,
        description: request.body.description,
        richDescription: request.body.richDescription,
        image: `${basePath}${fileName}`,// "http://localhost:3000/public/upload/image-2323232"
        brand: request.body.brand,
        price: request.body.price,
        category: request.body.category,
        countInStock: request.body.countInStock,
        rating: request.body.rating,
        numReviews: request.body.numReviews,
        isFeatured: request.body.isFeatured,
    })

    product = await product.save();

    if (!product)
        return response.status(500).send('The product cannot be created')

    response.send(product);
})

router.put('/:id', async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.id)) {
        return response.status(400).send('Invalid Product Id')
    }
    const category = await Category.findById(request.body.category);
    if (!category) return response.status(400).send('Invalid Category')

    const product = await Product.findByIdAndUpdate(
        request.params.id,
        {
            name: request.body.name,
            description: request.body.description,
            richDescription: request.body.richDescription,
            image: request.body.image,
            brand: request.body.brand,
            price: request.body.price,
            category: request.body.category,
            countInStock: request.body.countInStock,
            rating: request.body.rating,
            numReviews: request.body.numReviews,
            isFeatured: request.body.isFeatured,
        },
        { new: true }
    )

    if (!product)
        return response.status(500).send('the product cannot be updated!')

    response.send(product);
})

router.delete('/:id', (request, response) => {
    Product.findByIdAndRemove(request.params.id).then(product => {
        if (product) {
            return response.status(200).json({ success: true, message: 'the product is deleted!' })
        } else {
            return response.status(404).json({ success: false, message: "product not found!" })
        }
    }).catch(err => {
        return response.status(500).json({ success: false, error: err })
    })
})

router.get(`/get/count`, async (request, response) => {
    const productCount = await Product.countDocuments((count) => count)

    if (!productCount) {
        response.status(500).json({ success: false })
    }
    response.send({
        productCount: productCount
    });
})

router.get(`/get/featured/:count`, async (request, response) => {
    const count = request.params.count ? request.params.count : 0
    const products = await Product.find({ isFeatured: true }).limit(+count);

    if (!products) {
        response.status(500).json({ success: false })
    }
    response.send(products);
})

router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (request, response) => {
        if (!mongoose.isValidObjectId(request.params.id)) {
            return response.status(400).send('Invalid Product Id')
        }
        const files = request.files
        let imagesPaths = [];
        const basePath = `${request.protocol}://${request.get('host')}/public/uploads/`;

        if (files) {
            files.map(file => {
                imagesPaths.push(`${basePath}${file.filename}`);
            })
        }

        const product = await Product.findByIdAndUpdate(
            request.params.id,
            {
                images: imagesPaths
            },
            { new: true }
        )

        if (!product)
            return response.status(500).send('the gallery cannot be updated!')

        response.send(product);
    }
)

module.exports = router;