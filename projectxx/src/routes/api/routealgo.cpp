#include <bits/stdc++.h>
using namespace std;

const double INF = 1e18;

// Step 1: Floyd-Warshall for all-pairs shortest paths
void floydWarshall(vector<vector<double>>& dist) {
    int n = dist.size();
    for (int k = 0; k < n; ++k)
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
}

// Step 2: Prim's algorithm to build MST
vector<pair<int, int>> primMST(const vector<vector<double>>& cost) {
    int n = cost.size();
    vector<bool> inMST(n, false);
    vector<double> key(n, INF);
    vector<int> parent(n, -1);
    key[0] = 0;

    for (int count = 0; count < n; ++count) {
        int u = -1;
        double minKey = INF;
        for (int v = 0; v < n; ++v)
            if (!inMST[v] && key[v] < minKey)
                minKey = key[v], u = v;

        inMST[u] = true;

        for (int v = 0; v < n; ++v)
            if (!inMST[v] && cost[u][v] < key[v])
                key[v] = cost[u][v], parent[v] = u;
    }

    vector<pair<int, int>> mstEdges;
    for (int v = 1; v < n; ++v)
        if (parent[v] != -1)
            mstEdges.emplace_back(parent[v], v);
    return mstEdges;
}

// Step 3: Find vertices with odd degree
vector<int> findOddDegreeVertices(const vector<pair<int, int>>& edges, int n) {
    vector<int> degree(n, 0);
    for (auto [u, v] : edges) {
        degree[u]++;
        degree[v]++;
    }
    vector<int> oddVertices;
    for (int i = 0; i < n; ++i)
        if (degree[i] % 2 == 1)
            oddVertices.push_back(i);
    return oddVertices;
}

// Step 4: Greedy matching among odd-degree vertices
vector<pair<int, int>> greedyMatching(const vector<int>& oddVertices, const vector<vector<double>>& cost) {
    vector<bool> used(oddVertices.size(), false);
    vector<pair<int, int>> matching;
    for (size_t i = 0; i < oddVertices.size(); ++i) {
        if (used[i]) continue;
        double minCost = INF;
        int best = -1;
        for (size_t j = i+1; j < oddVertices.size(); ++j) {
            if (!used[j] && cost[oddVertices[i]][oddVertices[j]] < minCost) {
                minCost = cost[oddVertices[i]][oddVertices[j]];
                best = j;
            }
        }
        if (best != -1) {
            used[i] = used[best] = true;
            matching.emplace_back(oddVertices[i], oddVertices[best]);
        }
    }
    return matching;
}

// Step 5: Build multigraph and find Eulerian tour using Hierholzer's algorithm
void addEdge(multimap<int,int>& graph, int u, int v) {
    graph.insert({u,v});
    graph.insert({v,u});
}

void dfsEuler(int u, multimap<int,int>& graph, vector<int>& path) {
    while (true) {
        auto it = graph.find(u);
        if (it == graph.end()) break;
        int v = it->second;
        graph.erase(it);
        auto it2 = graph.find(v);
        while (it2 != graph.end() && it2->second != u) ++it2;
        if (it2 != graph.end()) graph.erase(it2);
        dfsEuler(v, graph, path);
    }
    path.push_back(u);
}

vector<int> eulerTour(const vector<pair<int,int>>& mst, const vector<pair<int,int>>& matching, int n) {
    multimap<int,int> graph;
    for (auto [u,v] : mst) addEdge(graph, u, v);
    for (auto [u,v] : matching) addEdge(graph, u, v);
    vector<int> path;
    dfsEuler(0, graph, path);
    reverse(path.begin(), path.end());
    return path;
}

// Step 6: Shortcut repeated nodes to get Hamiltonian tour
vector<int> shortcutTour(const vector<int>& euler, int n) {
    vector<bool> visited(n, false);
    vector<int> tour;
    for (int node : euler) {
        if (!visited[node]) {
            visited[node] = true;
            tour.push_back(node);
        }
    }
    tour.push_back(tour[0]); // return to start
    return tour;
}

// 🧪 Main function
int main() {
    int n;
    cin >> n;
    vector<vector<double>> graph(n, vector<double>(n, INF));
    for (int i = 0; i < n; ++i)
        graph[i][i] = 0;

    // Input: edges, complete graph
    for (int i = 0; i < n; ++i)
        for (int j = i+1; j < n; ++j) {
            double w;
            cin >> w;
            graph[i][j] = graph[j][i] = w;
        }

    // Step 1
    floydWarshall(graph);

    // Step 2
    auto mstEdges = primMST(graph);

    // Step 3
    auto oddVertices = findOddDegreeVertices(mstEdges, n);

    // Step 4
    auto matching = greedyMatching(oddVertices, graph);

    // Step 5
    auto euler = eulerTour(mstEdges, matching, n);

    // Step 6
    auto tour = shortcutTour(euler, n);

    // Output
    cout << "Approximate tour visiting all nodes:\n";
    for (int node : tour)
        cout << node << ' ';
    cout << '\n';

    // Calculate cost
    double cost = 0;
    for (size_t i = 0; i+1 < tour.size(); ++i)
        cost += graph[tour[i]][tour[i+1]];
    cout << "Total cost: " << cost << '\n';

    return 0;
}
