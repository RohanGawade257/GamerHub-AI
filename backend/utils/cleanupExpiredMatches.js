const Game = require("../models/Game");
const Chat = require("../models/Chat");

async function deleteExpiredMatches() {
  const expiredMatches = await Game.find({ dateTime: { $lt: new Date() } }).select("_id");
  if (!expiredMatches.length) {
    return 0;
  }

  const expiredMatchIds = expiredMatches.map((match) => match._id);
  await Chat.deleteMany({ matchId: { $in: expiredMatchIds } });
  await Game.deleteMany({ _id: { $in: expiredMatchIds } });

  return expiredMatchIds.length;
}

function scheduleExpiredMatchCleanup(logger = console) {
  const runCleanup = async () => {
    try {
      const deletedCount = await deleteExpiredMatches();
      if (deletedCount > 0) {
        logger.log(`[cleanup] Removed ${deletedCount} expired matches`);
      }
    } catch (error) {
      logger.error("[cleanup] Failed to remove expired matches:", error.message);
    }
  };

  void runCleanup();
  const timer = setInterval(runCleanup, 60 * 60 * 1000);
  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return timer;
}

module.exports = {
  deleteExpiredMatches,
  scheduleExpiredMatchCleanup,
};
