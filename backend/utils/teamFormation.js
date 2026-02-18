function autoFormTeams(players) {
  const sortedPlayers = [...players].sort((left, right) => {
    return (Number(right.skillLevel) || 1) - (Number(left.skillLevel) || 1);
  });

  const teamA = [];
  const teamB = [];
  let teamAScore = 0;
  let teamBScore = 0;

  for (const player of sortedPlayers) {
    const skill = Number(player.skillLevel) || 1;

    if (teamA.length < teamB.length) {
      teamA.push(player._id);
      teamAScore += skill;
      continue;
    }

    if (teamB.length < teamA.length) {
      teamB.push(player._id);
      teamBScore += skill;
      continue;
    }

    if (teamAScore <= teamBScore) {
      teamA.push(player._id);
      teamAScore += skill;
    } else {
      teamB.push(player._id);
      teamBScore += skill;
    }
  }

  return {
    teamA,
    teamB,
  };
}

module.exports = {
  autoFormTeams,
};
