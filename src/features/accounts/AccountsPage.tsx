import { useState } from 'react';
import PageHeader from '../../common/components/PageHeader.tsx';
import Button from '../../common/components/Button.tsx';
import AccountForm from './AccountForm.tsx';
import AssetForm from './AssetForm.tsx';
import DebtList from './DebtList.tsx';
import CashAccountsList from './SavingsList.tsx';
import InvestmentsList from './InvestmentsList.tsx';
import AssetList from './AssetList.tsx';
import type { Account, Asset } from '../../common/types/index.ts';

export default function AccountsPage() {
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>();
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | undefined>();

  function handleEditAccount(account: Account) {
    setEditAccount(account);
    setShowAccountForm(true);
  }

  function handleCloseAccountForm() {
    setShowAccountForm(false);
    setEditAccount(undefined);
  }

  function handleEditAsset(asset: Asset) {
    setEditAsset(asset);
    setShowAssetForm(true);
  }

  function handleCloseAssetForm() {
    setShowAssetForm(false);
    setEditAsset(undefined);
  }

  return (
    <div>
      <PageHeader title="Accounts">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAssetForm(true)}>+ Add Asset</Button>
          <Button onClick={() => setShowAccountForm(true)}>+ Add Account</Button>
        </div>
      </PageHeader>
      <div className="space-y-6">
        <DebtList onEdit={handleEditAccount} />
        <CashAccountsList onEdit={handleEditAccount} />
        <InvestmentsList onEdit={handleEditAccount} />
        <AssetList onEdit={handleEditAsset} />
      </div>
      <AccountForm open={showAccountForm} onClose={handleCloseAccountForm} editAccount={editAccount} />
      <AssetForm open={showAssetForm} onClose={handleCloseAssetForm} editAsset={editAsset} />
    </div>
  );
}
