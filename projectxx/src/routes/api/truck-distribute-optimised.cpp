#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
#include <string>
#include <tuple>
#include <limits>
#include <set>
using namespace std;

// Helper to compute total demand (volume) for a set of vendors
int total_demand(const vector<vector<vector<string>>>& v, const vector<int>& vendor_indices) {
    int sum = 0;
    for (int idx : vendor_indices) {
        for (const auto& item : v[idx]) {
            sum += stoi(item[1]) * stoi(item[2]);
        }
    }
    return sum;
}

// Helper to generate all partitions of vendors into trucks (with capacity constraint)
void generate_partitions(int n, int truckvol, const vector<vector<vector<string>>>& v,
                         vector<vector<vector<int>>>& partitions, vector<vector<int>>& current, int idx) {
    if (idx == n) {
        partitions.push_back(current);
        return;
    }
    for (auto& truck : current) {
        truck.push_back(idx);
        if (total_demand(v, truck) <= truckvol) {
            generate_partitions(n, truckvol, v, partitions, current, idx + 1);
        }
        truck.pop_back();
    }
    // Try starting a new truck
    current.push_back({idx});
    if (total_demand(v, current.back()) <= truckvol) {
        generate_partitions(n, truckvol, v, partitions, current, idx + 1);
    }
    if (!current.empty()) current.pop_back();
}

// Compute the optimal route for a truck (warehouse -> vendors -> warehouse)
pair<vector<int>, double> best_route(const vector<int>& vendor_indices, const vector<vector<double>>& dist) {
    vector<int> perm = vendor_indices;
    double min_cost = numeric_limits<double>::max();
    vector<int> best_perm;
    sort(perm.begin(), perm.end());
    do {
        double cost = 0;
        int prev = 0; // warehouse is 0
        for (int idx : perm) cost += dist[prev][idx+1], prev = idx+1;
        cost += dist[prev][0]; // return to warehouse
        if (cost < min_cost) {
            min_cost = cost;
            best_perm = perm;
        }
    } while (next_permutation(perm.begin(), perm.end()));
    return {best_perm, min_cost};
}

int main() {
    int n;
    cin >> n;
    vector<string> vendorIds(n);
    vector<vector<vector<string>>> v(n); // v[i]: items for vendor i
    map<string, int> itemVolumeMap, idmap;
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
            itemVolumeMap[itemId] = volume;
            idmap[itemId] = quantity;
        }
        v[i] = a;
    }
    int truckvol;
    cin >> truckvol;

    // Read distance matrix
    int m;
    cin >> m;
    vector<vector<double>> dist(m, vector<double>(m));
    for (int i = 0; i < m; ++i)
        for (int j = 0; j < m; ++j)
            cin >> dist[i][j];

    // Generate all partitions of vendors into trucks (with capacity constraint)
    vector<vector<vector<int>>> partitions;
    vector<vector<int>> current;
    generate_partitions(n, truckvol, v, partitions, current, 0);

    double best_total = numeric_limits<double>::max();
    vector<vector<int>> best_partition;
    vector<vector<int>> best_routes;
    vector<vector<int>> best_route_orders;

    // For each partition, find best route for each truck and sum total distance
    for (const auto& partition : partitions) {
        double total = 0;
        vector<vector<int>> route_orders;
        for (const auto& truck : partition) {
            if (truck.empty()) continue;
            auto [order, cost] = best_route(truck, dist);
            total += cost;
            route_orders.push_back(order);
        }
        if (total < best_total) {
            best_total = total;
            best_partition = partition;
            best_route_orders = route_orders;
        }
    }

    // Output in the same format as before
    cout << "Number of trucks needed: " << best_partition.size() << endl;
    for (size_t t = 0; t < best_partition.size(); ++t) {
        const auto& truck = best_partition[t];
        const auto& order = best_route_orders[t];
        set<string> truckVendors;
        for (int idx : truck) truckVendors.insert(vendorIds[idx]);
        cout << "Truck " << (t+1) << " (Destinations: ";
        size_t cnt = 0;
        for (const auto& vid : truckVendors) {
            cout << vid;
            if (++cnt < truckVendors.size()) cout << ", ";
        }
        cout << "): ";
        // Output items
        for (int idx : truck) {
            for (const auto& item : v[idx]) {
                cout << "Item " << item[0] << " from " << vendorIds[idx] << " (qty: " << item[1] << ") ";
            }
        }
        cout << endl;
    }
    return 0;
}