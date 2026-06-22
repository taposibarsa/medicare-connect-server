const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const usersController = require('../controllers/users.controller');

const router = express.Router();

router.get('/me', verifyJWT, usersController.getMe);
router.put('/me', verifyJWT, usersController.updateMe);

router.get('/', verifyJWT, authorizeRoles('admin'), usersController.listUsers);
router.patch(
  '/:id/suspend',
  verifyJWT,
  authorizeRoles('admin'),
  usersController.suspendUser
);
router.delete('/:id', verifyJWT, authorizeRoles('admin'), usersController.deleteUser);

module.exports = router;
