export const getRandomNumberPrice = () => {
  const diff = Date.now() - Date.UTC(2022, 11, 13, 12, 0, 0, 0);

  return 9 + Math.ceil(diff / 1000 / 60 / 60 / 3);
};
