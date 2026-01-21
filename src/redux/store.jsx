import { configureStore } from "@reduxjs/toolkit";
import branchReducer from "./slices/branchSlice";
import csoReducer from "./slices/csoSlice";
import csoAuthReducer from "./slices/csoAuthSlice";
import uploadReducer from "./slices/uploadSlice";
import loanReducer from "./slices/loanSlice";
import adminLoanReducer from "./slices/adminLoanSlice";
import adminRemittanceReducer from "./slices/adminRemittanceSlice";
import adminDailyTransactionReducer from "./slices/adminDailyTransactionSlice";
import holidayReducer from "./slices/holidaySlice";
import adminPanelReducer from "./slices/adminPanelSlice";
import adminAuthReducer from "./slices/adminAuthSlice";
import expenseReducer from "./slices/expenseSlice";
import cashAtHandReducer from "./slices/cashAtHandSlice";
import groupLeaderReducer from "./slices/groupLeaderSlice";
import interestReducer from "./slices/interestSlice";

const store = configureStore({
  reducer: {
    branch: branchReducer,
    cso: csoReducer,
    csoAuth: csoAuthReducer,
    upload: uploadReducer,
    loan: loanReducer,
    adminLoans: adminLoanReducer,
    adminRemittance: adminRemittanceReducer,
    adminDailyTransactions: adminDailyTransactionReducer,
    holiday: holidayReducer,
    adminPanel: adminPanelReducer,
    adminAuth: adminAuthReducer,
    expenses: expenseReducer,
    cashAtHand: cashAtHandReducer,
    groupLeader: groupLeaderReducer,
    interest: interestReducer,
  },
});

export default store;
