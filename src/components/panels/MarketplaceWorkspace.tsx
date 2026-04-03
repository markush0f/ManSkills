import { useMarketplaceDetail } from "../../hooks/useMarketplaceDetail";
import { shellPanelClass } from "../shared/ui";
import { MarketplaceBody } from "./marketplace/MarketplaceBody";
import { MarketplaceProvider } from "./marketplace/MarketplaceContext";
import { MarketplaceToolbar } from "./marketplace/MarketplaceToolbar";
import { MarketplaceTabsHeader } from "./MarketplaceTabsHeader";

export function MarketplaceWorkspace() {
  const { marketplaceContextValue, marketplaceInstallError, marketplaceInstallMessage } = useMarketplaceDetail();

  return (
    <MarketplaceProvider value={marketplaceContextValue}>
      <section
        className={`${shellPanelClass} h-full min-h-0 min-w-0 overflow-hidden bg-[image:var(--editor-bg)]`}
        style={{ fontFamily: "var(--font-soft)" }}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <MarketplaceTabsHeader />

          <div className="min-h-0 overflow-auto">
            <div className="flex w-full min-h-full flex-col">
              <section className="min-h-full border-y border-[var(--border)] bg-[rgba(10,16,21,0.9)]">
                <MarketplaceToolbar />

                {marketplaceInstallError ? (
                  <div className="border-b border-[#cf5e4f]/20 px-4 py-3 text-[12px] text-[#ffb3a7]">
                    {marketplaceInstallError}
                  </div>
                ) : null}

                {marketplaceInstallMessage ? (
                  <div className="border-b border-[rgba(79,168,199,0.18)] px-4 py-3 text-[12px] text-[#a7dfd9]">
                    {marketplaceInstallMessage}
                  </div>
                ) : null}

                <MarketplaceBody />
              </section>
            </div>
          </div>
        </div>
      </section>
    </MarketplaceProvider>
  );
}
