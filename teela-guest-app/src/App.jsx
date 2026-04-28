import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import StaffProtectedRoute from './components/StaffProtectedRoute'
import HomePage from './pages/HomePage'
import CheckinPage from './pages/CheckinPage'
import StayLayout from './pages/Checkin'
import BookingVerify from './pages/Checkin/BookingVerify'
import Preferences from './pages/Checkin/Preferences'
import Welcome from './pages/Checkin/Welcome'
import Dashboard from './pages/Home/Dashboard'
import ActivityList from './pages/Activities/ActivityList'
import MenuPage from './pages/Menu/MenuPage'
import ChatPage from './pages/Chat/ChatPage'
import BillPage from './pages/Bill/BillPage'
import CheckoutConfirm from './pages/Bill/CheckoutConfirm'
import StaffLogin from './pages/Staff/Login'
import StaffDashboard from './pages/Staff/Dashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/stay" element={<StayLayout />}>
            <Route path="/stay/:token/preferences" element={<Preferences />} />
            <Route path="/stay/:token/welcome" element={<Welcome />} />
            <Route path="/stay/:token/home" element={<Dashboard />} />
            <Route path="/stay/:token/menu" element={<MenuPage />} />
            <Route path="/stay/:token/activities" element={<ActivityList />} />
            <Route path="/stay/:token/chat" element={<ChatPage />} />
            <Route path="/stay/:token/bill" element={<BillPage />} />
            <Route path="/stay/:token/checkout-confirm" element={<CheckoutConfirm />} />
          </Route>
          <Route path="/stay/verify" element={<BookingVerify />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route
            path="/staff/dashboard"
            element={
              <StaffProtectedRoute>
                <StaffDashboard />
              </StaffProtectedRoute>
            }
          />
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
