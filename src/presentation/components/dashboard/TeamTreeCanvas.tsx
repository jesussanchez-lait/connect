"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useCampaignUsers } from "@/src/presentation/hooks/useCampaignUsers";
import { User } from "@/src/domain/entities/User";

interface MultiplierNode {
  multiplier: User;
  children: MultiplierNode[];
  level: number;
}

export function TeamTreeCanvas() {
  const { selectedCampaigns } = useCampaign();
  const { users, loading } = useCampaignUsers(selectedCampaigns);

  // Filtrar solo multiplicadores
  const multipliers = useMemo(() => {
    return users.filter((user) => user.role === "MULTIPLIER");
  }, [users]);

  // Construir árbol jerárquico de multiplicadores
  const buildMultiplierTree = useMemo(() => {
    if (multipliers.length === 0) return [];

    // Crear mapa de multiplicadores por ID
    const multiplierMap = new Map<string, User>();
    multipliers.forEach((m) => multiplierMap.set(m.id, m));

    // Crear mapa de hijos por leaderId
    const childrenMap = new Map<string, User[]>();
    multipliers.forEach((multiplier) => {
      if (multiplier.leaderId) {
        if (!childrenMap.has(multiplier.leaderId)) {
          childrenMap.set(multiplier.leaderId, []);
        }
        childrenMap.get(multiplier.leaderId)!.push(multiplier);
      }
    });

    // Función recursiva para construir el árbol
    const buildNode = (multiplier: User, level: number): MultiplierNode => {
      const children = childrenMap.get(multiplier.id) || [];
      return {
        multiplier,
        children: children.map((child) => buildNode(child, level + 1)),
        level,
      };
    };

    // Identificar multiplicadores raíz (sin leaderId o cuyo leaderId no es un multiplicador)
    const rootMultipliers = multipliers.filter((m) => {
      if (!m.leaderId) return true;
      // Si el leaderId existe pero no es un multiplicador, es raíz
      const leader = multiplierMap.get(m.leaderId);
      return !leader || leader.role !== "MULTIPLIER";
    });

    return rootMultipliers.map((root) => buildNode(root, 0));
  }, [multipliers]);

  // Construir nodos y edges para React Flow con layout jerárquico
  const { nodes, edges } = useMemo(() => {
    if (selectedCampaigns.length === 0 || multipliers.length === 0) {
      return { nodes: [], edges: [] };
    }

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Nodo raíz: Campaña
    const campaignName =
      selectedCampaigns.length === 1
        ? selectedCampaigns[0].name
        : `${selectedCampaigns.length} Campañas`;

    const rootNode: Node = {
      id: "campaign-root",
      type: "default",
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div className="text-center px-4 py-2">
            <div className="font-bold text-lg text-indigo-600">
              {campaignName}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {multipliers.length} Multiplicadores
            </div>
          </div>
        ),
      },
      style: {
        background: "#f3f4f6",
        border: "2px solid #6366f1",
        borderRadius: "8px",
        padding: "8px",
        minWidth: "200px",
      },
    };

    flowNodes.push(rootNode);
    nodePositions.set("campaign-root", { x: 0, y: 0 });

    // Constantes de layout
    const horizontalSpacing = 300; // Espacio horizontal entre niveles
    const verticalSpacing = 180; // Espacio vertical entre nodos del mismo nivel
    const startX = 350; // Posición X inicial para multiplicadores

    // Función para calcular el número de hojas (nodos terminales) de un subárbol
    const countLeaves = (node: MultiplierNode): number => {
      if (node.children.length === 0) return 1;
      return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
    };

    // Función recursiva para posicionar nodos (retorna la posición Y final)
    const positionNode = (
      node: MultiplierNode,
      parentId: string | null,
      x: number,
      startY: number
    ): number => {
      const nodeId = `multiplier-${node.multiplier.id}`;

      let currentY = startY;

      // Si tiene hijos, posicionarlos primero
      if (node.children.length > 0) {
        let childStartY = startY;
        const childPositions: number[] = [];

        // Posicionar cada hijo recursivamente
        node.children.forEach((child) => {
          const childLeaves = countLeaves(child);
          const childEndY = positionNode(
            child,
            nodeId,
            x + horizontalSpacing,
            childStartY
          );
          childPositions.push((childStartY + childEndY) / 2);
          childStartY = childEndY + verticalSpacing;
        });

        // Centrar el nodo padre sobre sus hijos
        if (childPositions.length > 0) {
          const minY = Math.min(...childPositions);
          const maxY = Math.max(...childPositions);
          currentY = (minY + maxY) / 2;
        }
      }

      // Dividir nombre en nombre y apellido
      const nameParts = node.multiplier.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Crear nodo
      const multiplierNode: Node = {
        id: nodeId,
        type: "default",
        position: { x, y: currentY },
        data: {
          label: (
            <div className="text-center px-4 py-3">
              <div className="font-semibold text-base text-gray-900">
                {firstName}
              </div>
              {lastName && (
                <div className="font-semibold text-base text-gray-900">
                  {lastName}
                </div>
              )}
              <div className="text-sm text-indigo-600 mt-2 font-medium">
                {node.multiplier.participants || 0} participantes
              </div>
              {node.children.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {node.children.length} multiplicador
                  {node.children.length > 1 ? "es" : ""}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: "#ffffff",
          border: "2px solid #6366f1",
          borderRadius: "8px",
          padding: "8px",
          minWidth: "180px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      flowNodes.push(multiplierNode);
      nodePositions.set(nodeId, { x, y: currentY });

      // Crear edge desde el padre (si no es null)
      if (parentId) {
        const edge: Edge = {
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "smoothstep",
          style: {
            stroke: "#6366f1",
            strokeWidth: 2,
          },
          animated: false,
        };
        flowEdges.push(edge);
      }

      // Retornar la posición Y final (usado para posicionar el siguiente hermano)
      if (node.children.length > 0) {
        // Si tiene hijos, retornar la posición del último hijo + spacing
        const lastChildId = `multiplier-${
          node.children[node.children.length - 1].multiplier.id
        }`;
        const lastChildY = nodePositions.get(lastChildId)?.y || currentY;
        return lastChildY + verticalSpacing;
      }
      return currentY + verticalSpacing;
    };

    // Posicionar todos los árboles raíz
    let currentYOffset = 0;
    buildMultiplierTree.forEach((rootNode) => {
      const leaves = countLeaves(rootNode);
      const totalHeight = leaves * verticalSpacing;
      const startY = currentYOffset - totalHeight / 2;

      // Posicionar el árbol y obtener la posición Y final
      const endY = positionNode(rootNode, "campaign-root", startX, startY);

      // Crear edge desde campaña al multiplicador raíz
      const edge: Edge = {
        id: `edge-campaign-root-multiplier-${rootNode.multiplier.id}`,
        source: "campaign-root",
        target: `multiplier-${rootNode.multiplier.id}`,
        type: "smoothstep",
        style: {
          stroke: "#6366f1",
          strokeWidth: 2,
        },
        animated: false,
      };
      flowEdges.push(edge);

      // Actualizar offset para el siguiente árbol raíz
      currentYOffset = endY + verticalSpacing * 2;
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [selectedCampaigns, multipliers, buildMultiplierTree]);

  if (selectedCampaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Árbol de Participantes
        </h3>
        <p className="text-gray-500 text-center py-8">
          Selecciona una o más campañas para ver el árbol de participantes
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Árbol de Participantes
        </h3>
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (multipliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Árbol de Participantes
        </h3>
        <p className="text-gray-500 text-center py-8">
          No hay multiplicadores registrados en las campañas seleccionadas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Árbol de Participantes
      </h3>
      <div className="h-[600px] w-full border border-gray-200 rounded-lg overflow-hidden">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{
              padding: 0.2,
              maxZoom: 1.5,
              minZoom: 0.5,
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.id === "campaign-root") return "#6366f1";
                return "#8b5cf6";
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
