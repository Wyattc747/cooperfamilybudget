import { useApp } from '../../common/contexts/AppContext.tsx';
import AssetCard from './AssetCard.tsx';
import type { Asset } from '../../common/types/index.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

interface AssetListProps {
  onEdit: (asset: Asset) => void;
}

export default function AssetList({ onEdit }: AssetListProps) {
  const { state, dispatch } = useApp();
  const { assets } = state;
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Assets</h3>
        {assets.length > 0 && (
          <span className="text-sm font-semibold text-indigo-600">Total: {formatCurrency(totalAssets)}</span>
        )}
      </div>
      {assets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No assets added</p>
      ) : (
        <div className="space-y-2">
          {assets.map((a) => (
            <AssetCard
              key={a.id}
              asset={a}
              onEdit={onEdit}
              onDelete={(id) => dispatch({ type: 'DELETE_ASSET', payload: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
