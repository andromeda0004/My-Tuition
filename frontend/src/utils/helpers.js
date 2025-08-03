/**
 * Converts numeric grade to ordinal format (1 -> 1st, 2 -> 2nd, etc.)
 */
export const formatGrade = (grade) => {
  const num = parseInt(grade, 10);
  if (isNaN(num)) return '';
  
  if (num % 100 >= 11 && num % 100 <= 13) {
    return num + "th";
  }
  
  switch (num % 10) {
    case 1:
      return num + "st";
    case 2:
      return num + "nd";
    case 3:
      return num + "rd";
    default:
      return num + "th";
  }
};
