import { api, unwrapResponse } from "./axios";
import type {
  Board,
  BoardMember,
  CreateBoardRequest,
  InviteBoardMemberRequest,
  UpdateBoardRequest,
} from "../types";

interface ApiBoardMember extends Omit<BoardMember, "fullName"> {
  fullname: string;
}

interface ApiBoard extends Omit<Board, "members"> {
  members?: ApiBoardMember[];
}

function normalizeBoardMember(member: ApiBoardMember): BoardMember {
  return {
    ...member,
    fullName: member.fullname,
  };
}

function normalizeBoard(board: ApiBoard): Board {
  return {
    ...board,
    members: (board.members ?? []).map(normalizeBoardMember),
  };
}

export const boardsApi = {
  async getMyBoards() {
    const boards = await unwrapResponse<ApiBoard[]>(api.get("/boards"));
    return boards.map(normalizeBoard);
  },

  async getArchivedBoards() {
    const boards = await unwrapResponse<ApiBoard[]>(api.get("/boards/archived"));
    return boards.map(normalizeBoard);
  },

  async createBoard(payload: CreateBoardRequest) {
    return normalizeBoard(await unwrapResponse<ApiBoard>(api.post("/boards", payload)));
  },

  async updateBoard(boardId: number, payload: UpdateBoardRequest) {
    return normalizeBoard(await unwrapResponse<ApiBoard>(api.put(`/boards/${boardId}`, payload)));
  },

  deleteBoard(boardId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}`));
  },

  async getBoardMembers(boardId: number) {
    const members = await unwrapResponse<ApiBoardMember[]>(api.get(`/boards/${boardId}/members`));
    return members.map(normalizeBoardMember);
  },

  async inviteMember(boardId: number, payload: InviteBoardMemberRequest) {
    return normalizeBoardMember(
      await unwrapResponse<ApiBoardMember>(api.post(`/boards/${boardId}/members`, payload))
    );
  },

  removeMember(boardId: number, userId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}/members/${userId}`));
  },

  archiveBoard(boardId: number) {
    return unwrapResponse(api.put(`/boards/${boardId}/archive`));
  },

  unarchiveBoard(boardId: number) {
    return unwrapResponse(api.put(`/boards/${boardId}/unarchive`));
  },
};
