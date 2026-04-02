export const getDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};