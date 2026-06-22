const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const prescriptionsController = require('../controllers/prescriptions.controller');

const router = express.Router();

router.use(verifyJWT);

router.get('/', prescriptionsController.listPrescriptions);
router.post('/', authorizeRoles('doctor'), prescriptionsController.createPrescription);
router.put('/:id', authorizeRoles('doctor'), prescriptionsController.updatePrescription);

module.exports = router;
