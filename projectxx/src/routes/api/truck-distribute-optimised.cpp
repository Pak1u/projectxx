#include <iostream>
#include <vector>
#include <map>
#include <queue>
#include <algorithm>
#include <string>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<string> vendorIds(n);
    vector<vector<vector<string>>> v(n); // Now stores itemId as string
    map<string, int> m, idmap;
    
    for (int i = 0; i < n; i++) {
        string vendorId;
        cin >> vendorId;
        vendorIds[i] = vendorId;
        int k;
        cin >> k;
        vector<vector<string>> a(k, vector<string>(3));
        for(int j = 0; j < k; ++j) {
            string itemId;
            int quantity, volume;
            cin >> itemId >> quantity >> volume;
            a[j][0] = itemId;
            a[j][1] = to_string(quantity);
            a[j][2] = to_string(volume);
            m[itemId] = volume;
            idmap[itemId] = quantity;
        }
        v[i] = a;
    }

    int truckvol;
    cin >> truckvol;
    
    // New bin-packing logic: fill each truck with items from any vendor
    vector<vector<tuple<string, string, int>>> truck_and_their_items;
    vector<vector<string>> truck_destinations; // vendorIds for each truck
    vector<vector<int>> remainingItems(n); // remaining quantities for each vendor's items
    for(int i = 0; i < n; ++i) {
        remainingItems[i].resize(v[i].size());
        for(int j = 0; j < v[i].size(); ++j) {
            remainingItems[i][j] = stoi(v[i][j][1]);
        }
    }
    int totalItemsLeft = 0;
    for(int i = 0; i < n; ++i) for(int j = 0; j < v[i].size(); ++j) totalItemsLeft += remainingItems[i][j];
    while(totalItemsLeft > 0) {
        int remainingTruckVolume = truckvol;
        vector<tuple<string, string, int>> truckItems;
        vector<string> truckVendors;
        // Try to fill the truck with items from any vendor
        bool loaded = false;
        while(remainingTruckVolume > 0) {
            int best_i = -1, best_j = -1, best_volume = 0;
            // Find the largest item that fits
            for(int i = 0; i < n; ++i) {
                for(int j = 0; j < v[i].size(); ++j) {
                    int qty = remainingItems[i][j];
                    int volume = stoi(v[i][j][2]);
                    if(qty > 0 && volume <= remainingTruckVolume && volume > best_volume) {
                        best_i = i; best_j = j; best_volume = volume;
                    }
                }
            }
            if(best_i == -1) break; // No more items fit
            int qty = remainingItems[best_i][best_j];
            int volume = stoi(v[best_i][best_j][2]);
            int canFit = min(qty, remainingTruckVolume / volume);
            if(canFit == 0) break;
            truckItems.push_back({vendorIds[best_i], v[best_i][best_j][0], canFit});
            if(find(truckVendors.begin(), truckVendors.end(), vendorIds[best_i]) == truckVendors.end())
                truckVendors.push_back(vendorIds[best_i]);
            remainingItems[best_i][best_j] -= canFit;
            remainingTruckVolume -= canFit * volume;
            totalItemsLeft -= canFit;
            loaded = true;
        }
        if(loaded) {
            truck_and_their_items.push_back(truckItems);
            truck_destinations.push_back(truckVendors);
        } else {
            break;
        }
    }
    // Output results
    cout << "Number of trucks needed: " << truck_and_their_items.size() << endl;
    for(int i = 0; i < truck_and_their_items.size(); ++i) {
        cout << "Truck " << (i+1) << " (Destinations: ";
        for(int j = 0; j < truck_destinations[i].size(); ++j) {
            cout << truck_destinations[i][j];
            if(j < truck_destinations[i].size() - 1) cout << ", ";
        }
        cout << "): ";
        for(auto& item : truck_and_their_items[i]) {
            cout << "Item " << get<1>(item) << " from " << get<0>(item) << " (qty: " << get<2>(item) << ") ";
        }
        cout << endl;
    }
    
    return 0;
}