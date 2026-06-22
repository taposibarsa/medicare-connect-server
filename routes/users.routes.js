const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const usersController = require('../controllers/users.controller');
const { updateMeRules, userIdParam } = require('../validators/users.validator');

const router = express.Router();

router.get('/me', verifyJWT, usersController.getMe);
router.put('/me', verifyJWT, updateMeRules, validate, usersController.updateMe);

router.get('/', verifyJWT, authorizeRoles('admin'), usersController.listUsers);
router.patch(
  '/:id/suspend',
  verifyJWT,
  authorizeRoles('admin'),
  userIdParam,
  validate,
  usersController.suspendUser
);
router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('admin'),
  userIdParam,
  validate,
  usersController.deleteUser
);

module.exports = router;
