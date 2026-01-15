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
import KarmaAuto from './pages/KarmaAuto';
import KarmaStats from './pages/KarmaStats';
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
          <Route path="/karmadb/auto" element={<KarmaAuto />} />
          <Route path="/karmadb/stats" element={<KarmaStats />} />
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
