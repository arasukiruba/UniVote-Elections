import React from 'react';
import { LoginComponent } from './LoginComponent';
import { Role } from '../../types';

export default function MasterLogin() {
  return <LoginComponent title="Master Access" role={Role.MASTER} redirectPath="/master/dashboard" />;
}
