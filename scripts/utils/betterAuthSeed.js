const { hashPassword } = require('@better-auth/utils/password');

/**
 * Creates or updates a Better Auth credential account so email/password
 * login works on the Next.js client (providerId: "credential").
 */
async function syncBetterAuthCredential(db, userId, password) {
  const accounts = db.collection('account');
  const passwordHash = await hashPassword(password);
  const now = new Date();

  const existing = await accounts.findOne({
    userId,
    providerId: 'credential',
  });

  if (existing) {
    await accounts.updateOne(
      { _id: existing._id },
      {
        $set: {
          password: passwordHash,
          updatedAt: now,
        },
      }
    );
    return { created: false, accountId: existing._id };
  }

  const result = await accounts.insertOne({
    accountId: userId,
    providerId: 'credential',
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return { created: true, accountId: result.insertedId };
}

/**
 * Ensures the user document has fields Better Auth expects for sign-in.
 */
async function syncBetterAuthUserFields(db, user) {
  const users = db.collection('user');
  const now = new Date();

  const updates = {
    name: user.name,
    email: user.email,
    emailVerified: true,
    role: user.role,
    status: user.status || 'active',
    updatedAt: now,
  };

  if (user.photo) {
    updates.image = user.photo;
    updates.photo = user.photo;
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: updates,
      $setOnInsert: { createdAt: user.createdAt || now },
    }
  );
}

module.exports = {
  syncBetterAuthCredential,
  syncBetterAuthUserFields,
};
