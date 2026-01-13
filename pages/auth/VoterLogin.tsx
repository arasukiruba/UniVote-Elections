import React from 'react';
import { LoginComponent } from './LoginComponent';
import { Role } from '../../types';

export default function VoterLogin() {
  return <LoginComponent title="Voter Login" role={Role.VOTER} redirectPath="/voter/dashboard" allowRegister />;
}
