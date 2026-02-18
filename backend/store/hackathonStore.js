const store = {
  users: [],
  games: [],
  nextUserId: 1,
  nextGameId: 1,
};

function createId(prefix, key) {
  const value = store[key];
  store[key] += 1;
  return `${prefix}_${value}`;
}

module.exports = {
  store,
  createUserId: () => createId("u", "nextUserId"),
  createGameId: () => createId("g", "nextGameId"),
};
