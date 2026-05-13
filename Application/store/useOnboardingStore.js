import { create } from 'zustand';

export const useOnboardingStore = create((set) => ({
  // User Data
  gender: 'male',
  goal: 'muscle_gain',
  activityLevel: 'moderate',
  dateOfBirth: null,
  firstName: '',
  lastName: '',
  email: '',

  // Actions
  setGender: (gender) => set({ gender }),
  setDateOfBirth: (dateOfBirth) => set({ dateOfBirth }),
  setMetrics: (height, weight) => set({ height, weight }),
  setGoal: (goal) => set({ goal }),
  setActivityLevel: (activityLevel) => set({ activityLevel }),
  setBasicInfo: (firstName, lastName, email) => set({ firstName, lastName, email }),
  
  // Reset
  reset: () => set({
    gender: 'male',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    height: '',
    weight: '',
    goal: 'muscle_gain',
    firstName: '',
    lastName: '',
    email: '',
  }),
}));
