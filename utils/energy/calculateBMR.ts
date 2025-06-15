/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * @param weight Weight in kilograms
 * @param height Height in centimeters
 * @param age Age in years
 * @param biologicalSex 'male' or 'female'
 * @returns BMR in calories per day
 */
export function calculateBMR(
  weight: number | undefined,
  height: number | undefined,
  age: number | undefined,
  biologicalSex: string | undefined,
): number {
  // Default to 2000 calories if parameters are missing
  if (!weight || !height || !age || !biologicalSex) {
    return 2000;
  }

  // Mifflin-St Jeor Equation
  if (biologicalSex.toLowerCase() === 'male') {
    // For men: BMR = 10 × weight (kg) + 6.25 × height (cm) - 5 × age (years) + 5
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    // For women: BMR = 10 × weight (kg) + 6.25 × height (cm) - 5 × age (years) - 161
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

/**
 * Calculate daily caloric needs based on activity level
 * @param bmr Basal Metabolic Rate
 * @param activityLevel Activity level factor
 * @returns Daily calorie needs
 */
export function calculateDailyCalories(bmr: number, activityLevel: number = 1.0): number {
  return Math.round(bmr * activityLevel);
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth Date of birth string in YYYY-MM-DD format
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string | undefined): number | undefined {
  if (!dateOfBirth) return undefined;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // If birthday hasn't occurred yet this year, subtract 1
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
