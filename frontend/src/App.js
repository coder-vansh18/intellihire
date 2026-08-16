import React from 'react';
import { Router, Route, Switch } from 'wouter';
import "./App.css"; 
import HomePage from './components/HomePage';
import CompanyDashboard from './components/CompanyDashboard';
import CreateTest from './components/CreateTest';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import StudentResults from './components/StudentResults';
import MyTests from './components/MyTests';
import QuizzesPage from './components/QuizzesPage';
import PlacementsPage from './components/PlacementsPage';
import ResourcesPage from './components/ResourcesPage';
import QuizPage from './components/QuizPage';
import PlacementPage from './components/PlacementPage';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import AboutPage from './components/AboutPage';
import CodingPage from "./components/CodingPage";
import CodeEditor from "./pages/CodeEditor";
import InfiniteQuiz from "./pages/InfiniteQuiz";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/company-dashboard" component={CompanyDashboard} />
        <Route path="/create-test" component={CreateTest} />
        <Route path="/my-tests" component={MyTests} />
        <Route path="/results" component={StudentResults} />
        <Route path="/quizzes" component={QuizzesPage} />
        <Route path="/quiz/:id" component={QuizPage} />
        <Route path="/placements" component={PlacementsPage} />
        <Route path="/placement/:id" component={PlacementPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/coding" component={CodingPage} />
        <Route path="/editor" component={CodeEditor} />
        <Route path="/infinite-quiz" component={InfiniteQuiz} />
      </Switch>
    </Router>
  );
}

export default App;

