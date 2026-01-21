import { useRoutes } from "react-router-dom";
import { Suspense, lazy } from "react";
import TopLoader from "../Preload/TopLoader";
import Home from "../GuestPages/Home";
import GeneralLayout from "../GuestPages/LandingPage/Layout/General";
import AdminController from "../Controller/adminController";
import Dashboard from "../Users/Admin/Dashboard";
import Setting from "../Users/Admin/Setting";
import Branch from "../Users/Admin/Branch";
import BranchDetails from "../Users/Admin/Branches/BranchDetails";
import Cso from "../Users/Admin/cso";
import CsoDetails from "../Users/Admin/csoPages/CsoDetails";
import NewLoan from "../Users/Admin/LoanPages/NewLoan";
import NewLoanDetails from "../Users/Admin/LoanPages/NewLoanDetails";
import Disbursement from "../Users/Admin/LoanPages/Disbursement";
import AllLoans from "../Users/Admin/LoanPages/Loans/allLoans";
import CsoController from "../Controller/csoController";
import CsoHome from "../Users/CsosPages/csoHome";
import CsoLogin from "../Users/CsosPages/CsoLogin";
import CsoProfile from "../Users/CsosPages/CsoProfile";
import CsoSettings from "../Users/CsosPages/CsoSettings";
import LoanActiveDetails from "../Users/CsosPages/LoanActiveDetails";
import Payment from "../Users/CsosPages/Payment";
import MinimalLoanForm from "../Users/CsosPages/MinimalLoanForm";
import CustomerListLoans from "../Users/CsosPages/CustomerListLoans";
import CsoCollection from "../Users/CsosPages/CsoCollection";
import CsoLoan from "../Users/CsosPages/csoLoan";
import CsoDashboard from "../Users/CsosPages/CsoDashboard";
import Frontend from "../GuestPages/Frontend";
import SocialMedia from "../GuestPages/SocialMedia";
import Customers from "../Users/Admin/CustomerPages/Customers";
import CustomerLoanHistory from "../Users/Admin/CustomerPages/CustomerLoanHistory";
import CustomerDetails from "../Users/Admin/CustomerPages/CustomerDetails";
import CustomerFormPreview from "../Users/Admin/CustomerPages/CustomerFormPreview";
import AdminPanel from "../Users/Admin/AdminPanel";
import AdminSignIn from "../Users/Admin/LoginPages/Singin";
import AdminSignUp from "../Users/Admin/LoginPages/SignUp";
import Expenses from "../Users/Admin/Operations/Expenses";
import Holiday from "../Users/Admin/Operations/Holiday";
import CashAtHand from "../Users/Admin/Operations/CashAtHand";
import GroupLeader from "../Users/Admin/GroupLeader/GroupLeader";
import Transaction from "../Users/Admin/Transactions/Transaction";
import CsoReport from "../Users/Admin/Report/CsoReport/CsoReport";
import CsoReportDetails from "../Users/Admin/Report/CsoReport/CsoReportDetails";
import BusinessReport from "../Users/Admin/Report/OtherReport/BusinessReport";
import MonthlyReport from "../Users/Admin/Report/OtherReport/MonthlyReport";
import AllLandingPage from "../GuestPages/LandingPage/AllLandingPage";

export default function Routess() {
    return (
        <Suspense fallback={<TopLoader />}>
            {useRoutes([
                {
                    path: "/",
                    element: <GeneralLayout />,
                    children: [{ index: true, element: <AllLandingPage /> }],
                },
                { path: "/admin/signin", element: <AdminSignIn /> },
                { path: "/admin/signup", element: <AdminSignUp /> },
                 { path: "/frontend", element: <Frontend /> },
                 { path: "/social-media", element: <SocialMedia  /> },
                { path: "/cso/login", element: <CsoLogin /> },

                {
                    path: "/admin",
                    element: <AdminController />,
                    children: [
                        { path: "/admin/dashboard", element:<Dashboard /> },
                        { path: "/admin/loans", element:<NewLoan /> },
                        { path: "/admin/customers", element:<Customers /> },
                        { path: "/admin/customers/:bvn/loans", element:<CustomerLoanHistory /> },
                        { path: "/admin/customers/:bvn/details", element:<CustomerDetails /> },
                        { path: "/admin/customers/:bvn/form-preview", element:<CustomerFormPreview /> },
                        { path: "/admin/loans/:id", element:<NewLoanDetails /> },
                        { path: "/admin/disbursements", element:<Disbursement /> },
                        { path: "/admin/branch", element:<Branch /> },
                        { path: "/admin/branch/:id", element:<BranchDetails /> },
                        { path: "/admin/cso", element:<Cso /> },
                        { path: "/admin/cso/:id", element:<CsoDetails /> },
                        { path: "/admin/cso-loans", element:<AllLoans /> },
                        { path: "/admin/operations/expenses", element:<Expenses /> },
                         { path: "/admin/groupleaders", element:<GroupLeader /> },
                        { path: "/admin/operations/holiday", element: <Holiday /> },
                        { path: "/admin/operations/cash-at-hand", element:<CashAtHand /> },
                        { path: "/admin/transactions", element:<Transaction /> },
                        { path: "/admin/admins", element:<AdminPanel /> },
                        { path: "/admin/reports/cso", element:<CsoReport /> },
                        { path: "/admin/reports/cso/:csoId", element:<CsoReportDetails /> },
                        { path: "/admin/reports/business", element:<BusinessReport /> },
                        { path: "/admin/reports/monthly", element:<MonthlyReport /> },
                        { path: "/admin/settings", element:<Setting /> },
                       
                    ],
                },
                
                {
                    path: "/cso",
                    element: <CsoController />,
                    children: [
                        // { path: "/cso", element: <CsoDashboard /> },
                        { path: "/cso/dashboard", element: <CsoDashboard /> },
                        { path: "/cso", element: <CsoHome /> },
                        { path: "/cso/profile", element: <CsoProfile /> },
                        { path: "/cso/settings", element: <CsoSettings /> },
                         { path: "/cso/collections", element: <CsoCollection /> },
                         { path: "/cso/all-loans", element: <CsoLoan /> },
                        { path: "/cso/loans/:id", element: <LoanActiveDetails /> },
                        { path: "/cso/loans/:id/payment", element: <Payment /> },
                        { path: "/cso/loans/:id/new-loan", element: <MinimalLoanForm /> },
                        { path: "/cso/customers/:bvn/loans", element: <CustomerListLoans /> },
                       
                    ],
                },
              
             
            ])}
            
        </Suspense>


    );
}
