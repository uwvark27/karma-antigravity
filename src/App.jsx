import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

import FamilyFeed from './pages/FamilyFeed';
import Beerjuvenation from './pages/Beerjuvenation';
import HolidayPhotos from './pages/HolidayPhotos';

import KarmaDB from './pages/KarmaDB';
import KarmaToday from './pages/KarmaToday';
import KarmaHealth from './pages/KarmaHealth';
import HealthActivities from './pages/health/HealthActivities';
import HealthWeight from './pages/health/HealthWeight';
import HealthPersonalCare from './pages/health/HealthPersonalCare';
import HealthCoitus from './pages/health/HealthCoitus';
import HealthLog from './pages/health/HealthLog';
import KarmaAuto from './pages/KarmaAuto';
import AutoGas from './pages/auto/AutoGas';
import KarmaStats from './pages/KarmaStats';
import KarmaAdmin from './pages/KarmaAdmin';
import AdminCalendars from './pages/admin/AdminCalendars';
import AdminFamilyMembers from './pages/admin/AdminFamilyMembers';
import AdminPlace from './pages/admin/AdminPlace';
import AdminArchitecture from './pages/admin/AdminArchitecture';
import Beer from './pages/Beer';
import Media from './pages/Media';
import Events from './pages/Events';
import MainLayout from './layouts/MainLayout';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in MainLayout */}
        <Route
          element={
            <>
              <SignedIn>
                <MainLayout />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/*" element={<Profile />} />
          <Route path="/family-feed" element={<FamilyFeed />} />
          <Route path="/beerjuvenation" element={<Beerjuvenation />} />
          <Route path="/holiday-photos" element={<HolidayPhotos />} />
          <Route path="/karmadb" element={<KarmaDB />} />
          <Route path="/karmadb/today" element={<KarmaToday />} />
          <Route path="/karmadb/health" element={<KarmaHealth />} />
          <Route path="/karmadb/health/activities" element={<HealthActivities />} />
          <Route path="/karmadb/health/weight" element={<HealthWeight />} />
          <Route path="/karmadb/health/personal-care" element={<HealthPersonalCare />} />
          <Route path="/karmadb/health/coitus" element={<HealthCoitus />} />
          <Route path="/karmadb/health/log" element={<HealthLog />} />
          <Route path="/karmadb/auto" element={<Navigate to="/karmadb/auto/gas" replace />} />
          <Route path="/karmadb/auto/gas" element={<AutoGas />} />
          <Route path="/karmadb/stats" element={<KarmaStats />} />
          <Route path="/karmadb/admin" element={<KarmaAdmin />} />
          <Route path="/karmadb/admin/calendars" element={<AdminCalendars />} />
          <Route path="/karmadb/admin/family-members" element={<AdminFamilyMembers />} />
          <Route path="/karmadb/admin/place" element={<AdminPlace />} />
          <Route path="/karmadb/admin/architecture" element={<AdminArchitecture />} />
          <Route path="/beer" element={<Beer />} />
          <Route path="/media" element={<Media />} />
          <Route path="/events" element={<Events />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
