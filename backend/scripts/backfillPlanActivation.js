require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../src/models/User");
const { syncActivationStatus } = require("../src/utils/activationStatus");

const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const users = await User.find({
      $or: [
        { "plans_paid.REGULAR": true, "plans_paid.VIP": true, "plans_paid.VVIP": true },
        {
          "activation_requests": {
            $all: [
              { $elemMatch: { plan: "REGULAR", status: "APPROVED" } },
              { $elemMatch: { plan: "VIP", status: "APPROVED" } },
              { $elemMatch: { plan: "VVIP", status: "APPROVED" } },
            ],
          },
        },
        {
          "plans.REGULAR.is_activated": true,
          "plans.VIP.is_activated": true,
          "plans.VVIP.is_activated": true,
        },
      ],
    });

    let updated = 0;
    let alreadyActive = 0;

    for (const user of users) {
      const before = {
        all_plans_completed: user.all_plans_completed,
        is_activated: user.is_activated,
        plans_paid: user.plans_paid || {},
        plans: ACTIVATION_PLANS.map((plan) => ({
          plan,
          paid: user.plans_paid?.[plan] === true,
          activated: user.plans?.[plan]?.is_activated === true,
        })),
      };

      const { changed } = syncActivationStatus(user);

      if (changed) {
        await user.save();
        updated += 1;
        console.log(`Updated ${user._id}`);
      } else {
        alreadyActive += 1;
      }

      const after = {
        all_plans_completed: user.all_plans_completed,
        is_activated: user.is_activated,
        plans_paid: user.plans_paid || {},
        plans: ACTIVATION_PLANS.map((plan) => ({
          plan,
          paid: user.plans_paid?.[plan] === true,
          activated: user.plans?.[plan]?.is_activated === true,
        })),
      };

      console.log(JSON.stringify({ id: user._id, before, after }));
    }

    console.log(`Backfill complete. Matched=${users.length}, Updated=${updated}, AlreadyActive=${alreadyActive}`);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
