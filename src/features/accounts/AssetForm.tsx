import { useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { Input, Select } from '../../common/components/FormInput.tsx';
import Button from '../../common/components/Button.tsx';
import Modal from '../../common/components/Modal.tsx';
import type { Asset } from '../../common/types/index.ts';
import { ASSET_CATEGORIES } from '../../common/types/index.ts';

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  editAsset?: Asset;
}

export default function AssetForm({ open, onClose, editAsset }: AssetFormProps) {
  const { dispatch } = useApp();
  const [name, setName] = useState(editAsset?.name ?? '');
  const [value, setValue] = useState(editAsset?.value.toString() ?? '');
  const [category, setCategory] = useState(editAsset?.category ?? 'Other');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedValue = parseFloat(value);
    if (!name.trim() || isNaN(parsedValue) || parsedValue < 0) return;

    const asset: Asset = {
      id: editAsset?.id ?? crypto.randomUUID(),
      name: name.trim(),
      value: parsedValue,
      category,
    };

    dispatch({ type: editAsset ? 'EDIT_ASSET' : 'ADD_ASSET', payload: asset });
    onClose();
  }

  const categoryOptions = ASSET_CATEGORIES.map((c) => ({ value: c, label: c }));

  return (
    <Modal open={open} onClose={onClose} title={editAsset ? 'Edit Asset' : 'Add Asset'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Asset Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 2020 Honda Civic, MacBook Pro"
        />
        <Input
          label="Estimated Value"
          type="number"
          step="0.01"
          min="0"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.00"
        />
        <Select
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editAsset ? 'Save' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
